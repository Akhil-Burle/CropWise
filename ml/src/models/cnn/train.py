"""Fine-tune EfficientNet-B0 on the versioned CropWise shared dataset release.

The data archive is deliberately not checked into Git. It may be supplied locally, fetched
from a regular URL, or downloaded as multiple release assets (for example GitHub Release
assets below GitHub's per-file size limit). The complete archive is SHA-256 verified before
safe extraction.
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import json
from pathlib import Path, PurePosixPath
import random
import shutil
import sys
import tarfile
import time

import requests
import torch
from sklearn.metrics import accuracy_score, precision_recall_fscore_support
from torch import nn
from torch.utils.data import DataLoader
from torchvision import models, transforms


ML = Path(__file__).resolve().parents[3]
if str(ML) not in sys.path:
    sys.path.insert(0, str(ML))
from src.data.dataset import CropWiseDataset

DEFAULT_RELEASE = "d053c9012200c857"
DEFAULT_SHA256 = "9d5d535aa6482c7c3522dc7bc77f0ea885429244da261a959fa75ace73d7a106"
DEFAULT_BYTES = 5517452986
DEFAULT_PART_COUNT = 3
PART_BYTES = 1800 * 1024 * 1024


def parse_args():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--release", default=DEFAULT_RELEASE)
    parser.add_argument("--dataset-dir", type=Path, help="Existing extracted bundle directory")
    parser.add_argument("--archive", type=Path, help="Existing complete .tar.gz bundle")
    parser.add_argument("--dataset-url", help="URL of a complete dataset .tar.gz")
    parser.add_argument(
        "--part-url-template",
        help="URL template for split archive assets; include {part}, formatted as 00, 01, ...",
    )
    parser.add_argument("--part-count", type=int, default=DEFAULT_PART_COUNT)
    parser.add_argument("--sha256", default=DEFAULT_SHA256, help="Expected SHA-256 of joined archive")
    parser.add_argument("--archive-bytes", type=int, default=DEFAULT_BYTES)
    parser.add_argument("--data-root", type=Path, default=ML / "data" / "training")
    parser.add_argument("--output-dir", type=Path)
    parser.add_argument("--epochs", type=int, default=20)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--num-workers", type=int, default=2)
    parser.add_argument("--image-size", type=int, default=224)
    parser.add_argument("--learning-rate", type=float, default=1e-4)
    parser.add_argument("--weight-decay", type=float, default=1e-4)
    parser.add_argument("--patience", type=int, default=5)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--device", choices=["auto", "cpu", "cuda"], default="auto")
    parser.add_argument("--no-pretrained", action="store_true", help="Do not download ImageNet weights")
    parser.add_argument("--force-extract", action="store_true", help="Replace the extracted release directory")
    args = parser.parse_args()
    if args.epochs < 1 or args.batch_size < 1 or args.num_workers < 0:
        parser.error("epochs/batch-size must be positive and num-workers cannot be negative")
    if args.part_count < 1 or args.archive_bytes < 1:
        parser.error("part-count and archive-bytes must be positive")
    if len(args.sha256) != 64 or any(ch not in "0123456789abcdefABCDEF" for ch in args.sha256):
        parser.error("sha256 must be a 64-character hexadecimal digest")
    if sum(bool(value) for value in (args.dataset_dir, args.archive, args.dataset_url, args.part_url_template)) > 1:
        parser.error("choose only one of --dataset-dir, --archive, --dataset-url or --part-url-template")
    if args.dataset_url and "{" in args.dataset_url:
        parser.error("--dataset-url is one complete file URL; use --part-url-template for split assets")
    return args


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        while block := stream.read(4 * 1024 * 1024):
            digest.update(block)
    return digest.hexdigest()


def download_file(url: str, target: Path, expected_bytes: int | None = None) -> None:
    """Stream and resume a download where the server supports HTTP Range."""
    target.parent.mkdir(parents=True, exist_ok=True)
    temporary = target.with_name(target.name + ".partial")
    offset = temporary.stat().st_size if temporary.exists() else 0
    headers = {"Range": f"bytes={offset}-"} if offset else {}
    with requests.get(url, headers=headers, stream=True, timeout=(30, 180), allow_redirects=True) as response:
        response.raise_for_status()
        append = offset > 0 and response.status_code == 206
        if offset and not append:
            offset = 0
        mode = "ab" if append else "wb"
        total = expected_bytes or 0
        if append and response.headers.get("Content-Range"):
            try:
                total = int(response.headers["Content-Range"].rsplit("/", 1)[1])
            except ValueError:
                pass
        received = offset
        last_log = time.monotonic()
        with temporary.open(mode) as stream:
            for block in response.iter_content(chunk_size=2 * 1024 * 1024):
                if not block:
                    continue
                stream.write(block)
                received += len(block)
                if time.monotonic() - last_log >= 10:
                    suffix = f"/{total:,}" if total else ""
                    print(f"DOWNLOAD {target.name}: {received:,}{suffix} bytes", flush=True)
                    last_log = time.monotonic()
    if expected_bytes and temporary.stat().st_size != expected_bytes:
        raise RuntimeError(f"Incomplete download {target}: {temporary.stat().st_size} bytes, expected {expected_bytes}")
    temporary.replace(target)


def obtain_archive(args) -> Path | None:
    if args.archive:
        archive = args.archive.resolve()
    elif args.dataset_url:
        archive = (args.data_root / f"cropwise-{args.release}.tar.gz").resolve()
        if not archive.exists() or (args.archive_bytes and archive.stat().st_size != args.archive_bytes):
            download_file(args.dataset_url, archive, args.archive_bytes)
    elif args.part_url_template:
        archive = (args.data_root / f"cropwise-{args.release}.tar.gz").resolve()
        if not archive.exists() or archive.stat().st_size != args.archive_bytes:
            parts_dir = args.data_root / f"cropwise-{args.release}.parts"
            parts_dir.mkdir(parents=True, exist_ok=True)
            pieces = []
            for index in range(args.part_count):
                piece = parts_dir / f"part-{index:02d}"
                url = args.part_url_template.format(part=f"{index:02d}")
                expected_piece_bytes = min(PART_BYTES, args.archive_bytes - index * PART_BYTES)
                if expected_piece_bytes <= 0:
                    raise ValueError("part-count exceeds the number of expected archive parts")
                if not piece.exists() or piece.stat().st_size != expected_piece_bytes:
                    print(f"Fetching dataset archive part {index + 1}/{args.part_count}", flush=True)
                    download_file(url, piece, expected_piece_bytes)
                pieces.append(piece)
            temporary = archive.with_name(archive.name + ".joining")
            with temporary.open("wb") as output:
                for piece in pieces:
                    with piece.open("rb") as source:
                        shutil.copyfileobj(source, output, length=8 * 1024 * 1024)
            if temporary.stat().st_size != args.archive_bytes:
                raise RuntimeError(f"Joined archive has {temporary.stat().st_size} bytes; expected {args.archive_bytes}")
            temporary.replace(archive)
    else:
        return None

    if not archive.is_file():
        raise FileNotFoundError(f"Dataset archive not found: {archive}")
    if archive.stat().st_size != args.archive_bytes:
        raise RuntimeError(f"Archive has {archive.stat().st_size} bytes; expected {args.archive_bytes}")
    actual = sha256_file(archive)
    if actual.lower() != args.sha256.lower():
        raise RuntimeError(f"Archive SHA-256 mismatch: expected {args.sha256}, got {actual}")
    print(f"VERIFIED archive SHA-256 {actual}", flush=True)
    return archive


def safe_extract(archive_path: Path, destination: Path, force: bool = False) -> Path:
    """Extract only regular files beneath a fresh destination; reject links/traversal."""
    if destination.exists():
        if not force and is_prepared_bundle(destination):
            print(f"Using existing prepared bundle: {destination}", flush=True)
            return destination
        if not force:
            raise FileExistsError(f"Dataset destination exists but is incomplete: {destination}; use --force-extract")
        shutil.rmtree(destination)
    staging = destination.with_name(destination.name + ".extracting")
    if staging.exists():
        shutil.rmtree(staging)
    staging.mkdir(parents=True)
    root = staging.resolve()
    try:
        with tarfile.open(archive_path, mode="r:gz") as bundle:
            members = bundle.getmembers()
            for member in members:
                name = PurePosixPath(member.name)
                if name.is_absolute() or ".." in name.parts or not member.isfile():
                    raise ValueError(f"Unsafe or unsupported archive member: {member.name}")
                target = (staging / Path(*name.parts)).resolve()
                if target != root and root not in target.parents:
                    raise ValueError(f"Archive member escapes dataset directory: {member.name}")
            for member in members:
                if member.isfile():
                    bundle.extract(member, staging)
        if not is_prepared_bundle(staging):
            raise ValueError("Extracted archive is missing expected manifests, class map, or image folders")
        destination.parent.mkdir(parents=True, exist_ok=True)
        staging.replace(destination)
    except Exception:
        shutil.rmtree(staging, ignore_errors=True)
        raise
    print(f"EXTRACTED dataset to {destination}", flush=True)
    return destination


def is_prepared_bundle(path: Path) -> bool:
    expected = ["train.csv", "validation.csv", "test.csv", "class_to_idx.json", "summary.json", "imagefolder"]
    return all((path / name).exists() for name in expected)


def loaders(data_dir: Path, image_size: int, batch_size: int, workers: int, device):
    normalization = transforms.Normalize(mean=(0.485, 0.456, 0.406), std=(0.229, 0.224, 0.225))
    train_transform = transforms.Compose([
        transforms.RandomResizedCrop(image_size, scale=(0.75, 1.0)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(15),
        transforms.ColorJitter(brightness=0.15, contrast=0.15, saturation=0.12),
        transforms.ToTensor(), normalization,
    ])
    eval_transform = transforms.Compose([
        transforms.Resize(image_size + 32), transforms.CenterCrop(image_size),
        transforms.ToTensor(), normalization,
    ])
    datasets = {
        split: CropWiseDataset(data_dir / f"{split}.csv", transform=transform)
        for split, transform in (("train", train_transform), ("validation", eval_transform), ("test", eval_transform))
    }
    kwargs = {"batch_size": batch_size, "num_workers": workers, "pin_memory": device.type == "cuda"}
    if workers:
        kwargs["persistent_workers"] = True
    result = {
        split: DataLoader(dataset, shuffle=(split == "train"), **kwargs)
        for split, dataset in datasets.items()
    }
    class_to_idx = datasets["train"].class_to_idx
    return result, class_to_idx


def run_epoch(model, loader, loss_fn, device, optimizer=None, scaler=None):
    training = optimizer is not None
    model.train(training)
    total_loss = 0.0
    y_true, y_pred = [], []
    amp_enabled = device.type == "cuda"
    context = torch.enable_grad if training else torch.inference_mode
    with context():
        for step, (images, labels) in enumerate(loader, start=1):
            images = images.to(device, non_blocking=True)
            labels = labels.to(device, non_blocking=True)
            if training:
                optimizer.zero_grad(set_to_none=True)
            with torch.autocast(device_type=device.type, dtype=torch.float16, enabled=amp_enabled):
                logits = model(images)
                loss = loss_fn(logits, labels)
            if training:
                scaler.scale(loss).backward()
                scaler.step(optimizer)
                scaler.update()
            total_loss += loss.item() * labels.size(0)
            y_true.extend(labels.detach().cpu().tolist())
            y_pred.extend(logits.argmax(1).detach().cpu().tolist())
            if training and step % 100 == 0:
                print(f"  batch {step}/{len(loader)} loss={loss.item():.4f}", flush=True)
    precision, recall, f1, _ = precision_recall_fscore_support(
        y_true, y_pred, labels=list(range(model.classifier[1].out_features)),
        average="macro", zero_division=0,
    )
    return {
        "loss": total_loss / len(loader.dataset),
        "accuracy": accuracy_score(y_true, y_pred),
        "macro_precision": precision,
        "macro_recall": recall,
        "macro_f1": f1,
        "y_true": y_true,
        "y_pred": y_pred,
    }


def main():
    args = parse_args()
    if args.output_dir is None:
        args.output_dir = ML / "checkpoints" / "cnn" / args.release
    device = torch.device("cuda" if args.device == "auto" and torch.cuda.is_available() else
                          "cpu" if args.device == "auto" else args.device)
    if device.type == "cuda" and not torch.cuda.is_available():
        raise SystemExit("CUDA was requested but PyTorch cannot access a CUDA device")
    seed_everything(args.seed)
    data_dir = args.dataset_dir.resolve() if args.dataset_dir else None
    if data_dir is not None:
        if not is_prepared_bundle(data_dir):
            raise SystemExit(f"Not a prepared CropWise bundle: {data_dir}")
    else:
        archive = obtain_archive(args)
        if archive is None:
            candidate = args.data_root / args.release
            if not is_prepared_bundle(candidate):
                raise SystemExit(
                    "No dataset found. Supply --dataset-dir, --archive, --dataset-url, or "
                    "--part-url-template; see ml/src/models/cnn/README.md."
                )
            data_dir = candidate
        else:
            data_dir = safe_extract(archive, args.data_root / args.release, args.force_extract)

    summary = json.loads((data_dir / "summary.json").read_text())
    if summary.get("release_id") != args.release:
        raise SystemExit(f"Dataset release {summary.get('release_id')} does not match requested {args.release}")
    loaders_by_split, class_to_idx = loaders(data_dir, args.image_size, args.batch_size, args.num_workers, device)
    if len(class_to_idx) != 105:
        print(f"NOTE: this release contains {len(class_to_idx)} classes", flush=True)
    weights = None if args.no_pretrained else models.EfficientNet_B0_Weights.DEFAULT
    model = models.efficientnet_b0(weights=weights)
    in_features = model.classifier[1].in_features
    model.classifier[1] = nn.Linear(in_features, len(class_to_idx))
    model = model.to(device)
    optimizer = torch.optim.AdamW(model.parameters(), lr=args.learning_rate, weight_decay=args.weight_decay)
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode="max", factor=0.5, patience=2)
    scaler = torch.amp.GradScaler("cuda", enabled=device.type == "cuda")
    loss_fn = nn.CrossEntropyLoss()
    args.output_dir.mkdir(parents=True, exist_ok=True)
    history, best_f1, stale_epochs = [], -1.0, 0
    start = time.time()
    print(f"TRAIN release={args.release} train={len(loaders_by_split['train'].dataset)} "
          f"validation={len(loaders_by_split['validation'].dataset)} test={len(loaders_by_split['test'].dataset)} "
          f"classes={len(class_to_idx)} device={device}", flush=True)
    for epoch in range(1, args.epochs + 1):
        epoch_start = time.time()
        train_metrics = run_epoch(model, loaders_by_split["train"], loss_fn, device, optimizer, scaler)
        val_metrics = run_epoch(model, loaders_by_split["validation"], loss_fn, device)
        scheduler.step(val_metrics["macro_f1"])
        row = {"epoch": epoch, "learning_rate": optimizer.param_groups[0]["lr"],
               "seconds": time.time() - epoch_start,
               **{f"train_{k}": v for k, v in train_metrics.items() if k not in ("y_true", "y_pred")},
               **{f"validation_{k}": v for k, v in val_metrics.items() if k not in ("y_true", "y_pred")}}
        history.append(row)
        print("EPOCH " + json.dumps(row), flush=True)
        if val_metrics["macro_f1"] > best_f1:
            best_f1, stale_epochs = val_metrics["macro_f1"], 0
            torch.save({"state_dict": model.state_dict(), "class_to_idx": class_to_idx,
                        "architecture": "torchvision.efficientnet_b0", "release_id": args.release,
                        "epoch": epoch, "validation_macro_f1": best_f1}, args.output_dir / "best.pt")
        else:
            stale_epochs += 1
            if stale_epochs >= args.patience:
                print(f"EARLY_STOP epoch={epoch} patience={args.patience}", flush=True)
                break

    checkpoint = torch.load(args.output_dir / "best.pt", map_location=device, weights_only=True)
    model.load_state_dict(checkpoint["state_dict"])
    test_metrics = run_epoch(model, loaders_by_split["test"], loss_fn, device)
    class_names = [name for name, _ in sorted(class_to_idx.items(), key=lambda item: item[1])]
    precision, recall, f1, support = precision_recall_fscore_support(
        test_metrics["y_true"], test_metrics["y_pred"], labels=list(range(len(class_names))), zero_division=0)
    with (args.output_dir / "per_class_metrics.csv").open("w", newline="") as stream:
        writer = csv.writer(stream)
        writer.writerow(["class_id", "class_name", "precision", "recall", "f1", "support"])
        writer.writerows((idx, class_names[idx], precision[idx], recall[idx], f1[idx], support[idx])
                         for idx in range(len(class_names)))
    with (args.output_dir / "history.csv").open("w", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=history[0].keys())
        writer.writeheader()
        writer.writerows(history)
    test_rows = loaders_by_split["test"].dataset.rows
    with (args.output_dir / "predictions.csv").open("w", newline="") as stream:
        fields = ["image_id", "true_class_id", "true_class", "predicted_class_id", "predicted_class", "correct"]
        writer = csv.DictWriter(stream, fieldnames=fields)
        writer.writeheader()
        for row, true_id, pred_id in zip(test_rows, test_metrics["y_true"], test_metrics["y_pred"]):
            writer.writerow({"image_id": row["image_id"], "true_class_id": true_id,
                             "true_class": class_names[true_id], "predicted_class_id": pred_id,
                             "predicted_class": class_names[pred_id], "correct": true_id == pred_id})
    metadata = {
        "model": "torchvision.efficientnet_b0", "pretrained": not args.no_pretrained,
        "weights": None if args.no_pretrained else "EfficientNet_B0_Weights.DEFAULT",
        "release_id": args.release, "dataset_summary": summary,
        "seed": args.seed, "epochs_completed": len(history), "best_epoch": checkpoint["epoch"],
        "batch_size": args.batch_size, "image_size": args.image_size,
        "learning_rate": args.learning_rate, "weight_decay": args.weight_decay,
        "device": str(device), "torch_version": torch.__version__,
        "torchvision_version": __import__("torchvision").__version__,
        "class_to_idx": class_to_idx, "test_metrics": {k: v for k, v in test_metrics.items() if k not in ("y_true", "y_pred")},
        "training_seconds": time.time() - start,
        "warning": "Publisher labels are experimental; test metrics are internal source-split metrics, not field accuracy.",
    }
    (args.output_dir / "run.json").write_text(json.dumps(metadata, indent=2) + "\n")
    print("TEST " + json.dumps(metadata["test_metrics"], sort_keys=True), flush=True)
    print(f"SAVED {args.output_dir / 'best.pt'}", flush=True)
    print(f"RUN_METADATA {args.output_dir / 'run.json'}", flush=True)


def seed_everything(seed: int):
    random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)
    torch.backends.cudnn.benchmark = False
    torch.backends.cudnn.deterministic = True


if __name__ == "__main__":
    main()
