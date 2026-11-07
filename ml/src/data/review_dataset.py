"""Evaluate the saved CNN on validation data and build a human-review queue; never deletes images."""
from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path
import sys

import torch
from torch import nn
from torchvision import models


ML = Path(__file__).resolve().parents[2]
if str(ML) not in sys.path:
    sys.path.insert(0, str(ML))

from src.models.cnn.train import loaders, run_epoch, write_class_metrics, write_predictions


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--release", type=Path, help="Prepared release folder; defaults to data/processed/latest.json")
    parser.add_argument("--checkpoint", type=Path, help="CNN best.pt; defaults to ml/checkpoints/cnn/<release>/best.pt")
    parser.add_argument("--output-dir", type=Path, help="Review output directory; defaults beside the checkpoint")
    parser.add_argument("--device", choices=["auto", "cpu", "cuda", "xpu"], default="auto")
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--num-workers", type=int, default=2)
    parser.add_argument("--amp", choices=["off", "bf16"], help="Override the run's recorded AMP mode")
    parser.add_argument("--channels-last", action="store_true", help="Evaluate using channels-last memory format")
    parser.add_argument("--min-train-images", type=int, default=150)
    parser.add_argument("--min-validation-images", type=int, default=20)
    parser.add_argument("--min-validation-f1", type=float, default=0.80)
    args = parser.parse_args()

    if args.release:
        release_dir = args.release.resolve()
    else:
        pointer = json.loads((ML / "data/processed/latest.json").read_text())
        release_dir = (ML / pointer["relative_path"]).resolve()
    summary = json.loads((release_dir / "summary.json").read_text())
    release_id = summary["release_id"]
    checkpoint_path = (args.checkpoint.resolve() if args.checkpoint else
                       ML / "checkpoints" / "cnn" / release_id / "best.pt")
    if not checkpoint_path.is_file():
        raise SystemExit(f"Checkpoint not found: {checkpoint_path}")

    if args.device == "auto":
        device_name = ("cuda" if torch.cuda.is_available() else
                       "xpu" if hasattr(torch, "xpu") and torch.xpu.is_available() else "cpu")
    else:
        device_name = args.device
    device = torch.device(device_name)
    if device.type == "cuda" and not torch.cuda.is_available():
        raise SystemExit("CUDA requested but unavailable")
    if device.type == "xpu" and (not hasattr(torch, "xpu") or not torch.xpu.is_available()):
        raise SystemExit("XPU requested but unavailable; install Intel's PyTorch XPU build and driver")

    checkpoint = torch.load(checkpoint_path, map_location=device, weights_only=True)
    if checkpoint.get("release_id") != release_id:
        raise SystemExit("Checkpoint and dataset release IDs differ")
    class_to_idx = json.loads((release_dir / "class_to_idx.json").read_text())
    if checkpoint.get("class_to_idx") != class_to_idx:
        raise SystemExit("Checkpoint and dataset class maps differ")
    run_metadata_path = checkpoint_path.parent / "run.json"
    run_metadata = json.loads(run_metadata_path.read_text()) if run_metadata_path.exists() else {}
    image_size = run_metadata.get("image_size", 224)
    data_loaders, _ = loaders(release_dir, image_size, args.batch_size, args.num_workers, device)
    model = models.efficientnet_b0(weights=None)
    model.classifier[1] = nn.Linear(model.classifier[1].in_features, len(class_to_idx))
    model.load_state_dict(checkpoint["state_dict"])
    model = model.to(device)
    channels_last = args.channels_last or run_metadata.get("channels_last", False)
    if channels_last:
        model = model.to(memory_format=torch.channels_last)
    metrics = run_epoch(model, data_loaders["validation"], nn.CrossEntropyLoss(), device,
                        amp=args.amp or run_metadata.get("amp", "off"), channels_last=channels_last)
    class_names = [name for name, _ in sorted(class_to_idx.items(), key=lambda item: item[1])]

    output_dir = args.output_dir.resolve() if args.output_dir else checkpoint_path.parent
    output_dir.mkdir(parents=True, exist_ok=True)
    write_class_metrics(output_dir / "validation_per_class_metrics.csv", metrics, class_names)
    write_predictions(output_dir / "validation_predictions.csv",
                      data_loaders["validation"].dataset.rows, metrics, class_names)

    counts = {row["label"]: row for row in csv.DictReader((release_dir / "class_counts.csv").open())}
    class_metrics = {
        row["class_name"]: row
        for row in csv.DictReader((output_dir / "validation_per_class_metrics.csv").open())
    }
    fields = ["label", "crop_id", "train_count", "validation_count", "test_count",
              "validation_precision", "validation_recall", "validation_f1", "validation_support",
              "review_flags", "decision", "review_notes"]
    review_labels = set()
    with (output_dir / "class_review.csv").open("w", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=fields)
        writer.writeheader()
        for label in sorted(class_to_idx):
            count = counts[label]
            score = class_metrics[label]
            flags = []
            if int(count["train"]) < args.min_train_images:
                flags.append("low_training_count")
            if int(count["validation"]) < args.min_validation_images:
                flags.append("low_validation_support")
            if float(score["f1"]) < args.min_validation_f1:
                flags.append("low_validation_f1")
            if flags:
                review_labels.add(label)
            writer.writerow({
                "label": label, "crop_id": label.split("__", 1)[0],
                "train_count": count["train"], "validation_count": count["validation"],
                "test_count": count["test"], "validation_precision": score["precision"],
                "validation_recall": score["recall"], "validation_f1": score["f1"],
                "validation_support": score["support"], "review_flags": ";".join(flags),
                "decision": "", "review_notes": "",
            })

    with (release_dir / "manifest.csv").open(newline="") as stream:
        label_conditions = {row["label"]: row["condition_type"] for row in csv.DictReader(stream)}
    with (release_dir / "validation.csv").open(newline="") as stream:
        manifest_rows = {row["image_id"]: row for row in csv.DictReader(stream)}
    predictions = list(csv.DictReader((output_dir / "validation_predictions.csv").open(newline="")))
    if len(predictions) != len(manifest_rows):
        raise SystemExit("Validation predictions do not match validation manifest row count")

    errors = []
    for prediction in predictions:
        if prediction["correct"] == "True":
            continue
        row = manifest_rows[prediction["image_id"]]
        predicted_crop = prediction["predicted_class"].split("__", 1)[0]
        predicted_condition = label_conditions.get(prediction["predicted_class"], "unknown")
        flags = []
        if int(counts[row["label"]]["train"]) < args.min_train_images:
            flags.append("low_training_count")
        if int(counts[row["label"]]["validation"]) < args.min_validation_images:
            flags.append("low_validation_support")
        if float(class_metrics[row["label"]]["f1"]) < args.min_validation_f1:
            flags.append("low_validation_f1")
        errors.append({
            "image_id": row["image_id"], "relative_path": row["relative_path"],
            "label": row["label"], "predicted_class": prediction["predicted_class"],
            "crop_id": row["crop_id"], "predicted_crop": predicted_crop,
            "same_crop": str(row["crop_id"] == predicted_crop),
            "condition_type": row["condition_type"], "predicted_condition_type": predicted_condition,
            "disease_predicted_healthy": str(row["condition_type"] != "healthy" and predicted_condition == "healthy"),
            "dataset_id": row["dataset_id"], "source_label": row["source_label"],
            "license": row["license"], "annotation_status": row["annotation_status"],
            "review_flags": ";".join(flags), "decision": "", "review_notes": "",
        })

    image_fields = ["image_id", "relative_path", "label", "predicted_class", "crop_id",
                    "predicted_crop", "same_crop", "condition_type", "predicted_condition_type",
                    "disease_predicted_healthy", "dataset_id", "source_label", "license",
                    "annotation_status", "review_flags", "decision", "review_notes"]
    write_review_rows(output_dir / "misclassified_validation.csv", errors, image_fields)
    weak_errors = [row for row in errors if row["label"] in review_labels]
    write_review_rows(output_dir / "weak_class_misclassified_validation.csv", weak_errors, image_fields)

    confusion_counts = {}
    for row in errors:
        key = (row["crop_id"], row["predicted_crop"], row["label"], row["predicted_class"])
        confusion_counts[key] = confusion_counts.get(key, 0) + 1
    with (output_dir / "validation_confusions.csv").open("w", newline="") as stream:
        writer = csv.writer(stream)
        writer.writerow(["true_crop", "predicted_crop", "true_class", "predicted_class", "errors"])
        for key, count in sorted(confusion_counts.items(), key=lambda item: (-item[1], item[0])):
            writer.writerow([*key, count])

    true_crop_counts = {}
    for row in errors:
        true_crop_counts[row["crop_id"]] = true_crop_counts.get(row["crop_id"], 0) + 1
    same_crop_errors = sum(row["same_crop"] == "True" for row in errors)
    disease_to_healthy = sum(row["disease_predicted_healthy"] == "True" for row in errors)
    summary_out = {
        "release_id": release_id,
        "checkpoint": str(checkpoint_path),
        "validation_images": len(predictions),
        "validation_errors_all_classes": len(errors),
        "validation_accuracy": metrics["accuracy"],
        "validation_macro_f1": metrics["macro_f1"],
        "same_crop_errors": same_crop_errors,
        "cross_crop_errors": len(errors) - same_crop_errors,
        "same_crop_share_of_errors": same_crop_errors / len(errors) if errors else 0.0,
        "disease_or_symptom_predicted_healthy": disease_to_healthy,
        "errors_with_unspecified_true_label": sum("unspecified" in row["label"] for row in errors),
        "errors_by_true_crop": dict(sorted(true_crop_counts.items(), key=lambda item: (-item[1], item[0]))),
        "flagged_weak_classes": sorted(review_labels),
        "errors_from_flagged_weak_classes": len(weak_errors),
        "note": "Error counts describe this validation split. No test rows or images were changed.",
    }
    (output_dir / "validation_error_summary.json").write_text(json.dumps(summary_out, indent=2) + "\n")

    print(f"Validation accuracy={metrics['accuracy']:.4f}; macro-F1={metrics['macro_f1']:.4f}")
    print(f"All validation errors: {len(errors)}; same-crop: {same_crop_errors}; cross-crop: {len(errors) - same_crop_errors}")
    print(f"Disease/symptom -> healthy errors: {disease_to_healthy}; weak-class subset: {len(weak_errors)}")
    print(f"Reports written under {output_dir}")
    print("No files were deleted or changed. Inspect original images and labels before deciding what to exclude.")


def write_review_rows(path: Path, rows: list[dict], fields: list[str]):
    with path.open("w", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)


if __name__ == "__main__":
    main()
