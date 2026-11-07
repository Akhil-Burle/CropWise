# Shared data pipeline

Executable tools:

- `download.py`: source discovery, resumable downloads, publisher checksums and provenance receipts.
- `extract.py`: safe ZIP extraction with augmentation/non-RGB exclusions and folder inventory.
- `map_folders.py`: explicit label normalization; unknown or ambiguous folders stay excluded.
- `prepare.py`: image decode checks, SHA/pixel hashes, rotation/flip-aware perceptual hashes,
  capture grouping, conservative conflict quarantine and versioned shared splits.
- `validate.py`: checks partition integrity, class coverage, source test boundaries and source files.
- `dataset.py`: PIL-based dataset usable by both models, with optional model-specific transforms.
- `export.py`: standalone ImageFolder/CSV bundle with actual image bytes and checksum.
- `report.py`: frozen dataset configuration, admission catalog and college review report.
- `review_dataset.py`: evaluates a saved CNN checkpoint on validation data and creates a class/image review queue; never deletes data.
- `test_prepare.py`: regression tests for leakage, duplicate handling and conflicting labels.

Use commands from `ml/data/README.md`. Both models must consume the same release and class map.
Perceptual/capture grouping is a heuristic, not proof that every physical leaf has been identified.

After CNN training, run `python ml/src/data/review_dataset.py` from the repository root. It writes
`class_review.csv`, `misclassified_validation.csv` (all validation errors),
`weak_class_misclassified_validation.csv` (the flagged-class subset),
`validation_confusions.csv`, and `validation_error_summary.json` beside the saved checkpoint. The
summary separates same-crop from cross-crop errors and counts disease/symptom predictions labeled
healthy. The default flags highlight low training counts, small validation support and low validation
F1. Use these reports to inspect images and labels manually. Model mistakes are review candidates,
not proof that a label is wrong; the script does not remove or edit images. It uses validation
predictions and leaves the test split out of the review/tuning loop.
