# CropWise ML — CNN and ViT comparative study

## Objective and status

Build **both a CNN and a Vision Transformer (ViT)** for crop leaf disease classification. Train and evaluate both, then retain their measured results for the college project review. ViT does not replace the CNN experiment; no winner is predetermined.

The data preparation pipeline now downloads source metadata and selected public image archives,
verifies publisher checksums where supplied, extracts images, applies explicit label mappings, checks
image integrity, groups duplicates and exports versioned shared manifests. Local download/preparation
status is described in `data/processed/` and the dataset preparation report in `docs/`.
See [data setup](data/README.md) for curation commands and [CNN training](src/models/cnn/README.md)
for the one-command clone setup, EfficientNet training, and optional dataset bundle distribution.
The entry point is `python ml/run_cnn.py`. ViT training remains **not implemented**. Soil-card OCR is implemented in `backend/cropwise_api/ml/soil/` (see [ocr/](src/ocr/README.md)). A trained
CNN checkpoint can be served to the website through the local API in `backend/` (see
[backend/README.md](../backend/README.md)); advice for its diagnoses still comes from demo protocols. Empty
result CSVs mean not measured, not zero.

## Structure

```text
ml/
  configs/comparison.json     shared experiment specification (not executable yet)
  data/                      local images and shared split manifests
  src/
    data/                    downloader, extraction, mapping, deduplication, splits and PIL loader
    models/cnn/              EfficientNet-B0 fine-tuning entry point
    models/vit/              ViT training/inference (planned)
    evaluation/              shared metrics and exports (planned)
    ocr/                     notes only; the OCR code is in backend/cropwise_api/ml/soil/
  checkpoints/               local trained weights, ignored by Git
  results/
    comparison.csv           summary metrics for both models
    per_class_metrics.csv    class-level precision, recall, F1 and support
    predictions.csv          matched image-level results from both models
    figures/                 confusion matrices, curves and comparison plots
```

## Model plan

- **CNN:** fine-tune a pretrained CNN; EfficientNet-B0 is the initial candidate.
- **ViT:** fine-tune a pretrained transformer; ViT-B/16 is the initial candidate.
- Final checkpoints depend on hardware and data. Record exact pretrained weight IDs, licenses, library versions, preprocessing and trainable parameters.
- Both models use identical class labels, split manifests and test images. Document model-specific normalization, input size and augmentation differences.

## Shared evaluation protocol

1. Inventory images, sources, labels and capture groups. Remove duplicates and check near-duplicates before splitting.
2. Create one versioned, stratified train/validation/test split, targeting 70/15/15 where class/group counts permit. Keep related images in one split and document adjustments. Both models consume the exact same manifests. Augment training data only.
3. If field photos are available, reserve a separate field test set and report results separately. Do not claim field accuracy before testing it.
4. Tune using training/validation data only. Use a documented, comparable tuning budget and record seeds, hyperparameters and early stopping. Select checkpoints by validation macro F1, never test scores.
5. Evaluate both on the same test images. If feasible, repeat training with three seeds while keeping splits fixed and report mean/standard deviation.
6. Report accuracy, macro precision/recall/F1, per-class scores/support and confusion matrices with the same class order. Macro F1 is the primary comparison metric.
7. Measure inference on the same device with batch size 1 and a documented warm-up/timing method. Record whether preprocessing is included. Report latency, model size, parameter count and training time.
8. Evaluate calibration and select rejection thresholds on validation data. The mock 0.70 threshold is provisional. Softmax confidence alone does not reliably reject non-leaf or unseen-disease images; test a separate rejection strategy.
9. Export matched predictions and run metadata for traceability. Include model/checkpoint IDs, split hashes, labels, seed, software, hardware and preprocessing.

## Review deliverables

- Dataset description, class counts and split rationale.
- CNN and ViT architecture diagrams and training settings.
- Training/validation curves, two confusion matrices and a comparison table.
- Matched examples: both correct, CNN-only correct, ViT-only correct and both wrong.
- Quality versus latency/model-size discussion and evidence-based deployment recommendation.

Populate `results/` only from real runs. Keep both models' results even if one performs worse. See `results/README.md` for export formats.

## Integration and separate tasks

Inference: image upload → FastAPI job → configured model → confidence/input checks → diagnosis → reviewed advisory rules. The first four steps exist today for the CNN (`backend/cropwise_api/`); reviewed advisory rules do not. Each diagnosis records the model and run ID that produced it. A new model plugs in by implementing the `LeafClassifier` protocol (`backend/cropwise_api/ml/base.py`) and registering it in `ml/registry.py`. The current app expects one diagnosis; a dual-model app comparison view requires API/schema/UI changes. An ensemble is outside the initial scope.

Soil Health Card OCR remains separate: extract N, P, K, pH, EC and OC with units, per-field confidence and image-relative bounding boxes for review. Neither disease classifier replaces OCR.

Optional later work: IndicTrans2 translation service and separately validated on-device inference. Demo outputs are not validated agricultural recommendations.
