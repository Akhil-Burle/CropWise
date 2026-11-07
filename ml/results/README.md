# College review results

The CSVs currently contain headers only. Populate them from actual evaluation runs; neither model has been trained or measured yet.

- `comparison.csv`: one row per model/run/split/evaluation dataset. Scores are fractions in [0,1], parameter count is total parameters, checkpoint size is bytes, training time is seconds, and latency is milliseconds.
- `per_class_metrics.csv`: one row per class/model/run/dataset. Scores use [0,1]; support counts test images of that class.
- `predictions.csv`: one row per image/model/run/dataset. Export a CNN row and a ViT row for every evaluated image. `correct` and `rejected` are booleans. `predicted_score` is a model score, not a guarantee of correctness.
- `figures/`: generated curves, confusion matrices and comparisons.

Use `cnn`/`vit` for model IDs. `dataset_id` distinguishes controlled and field evaluations; `split_id` identifies immutable shared manifests; `run_id` identifies a training run.

Store run-specific JSON metadata beside exports: model variant, pretrained weights, checkpoint hash, seed, split checksums, labels, transforms, hyperparameters, software versions, hardware and calibration/rejection procedure. Record timing warm-up, repetitions and preprocessing inclusion. Do not use test results to retune models. Keep both models' results regardless of performance.
