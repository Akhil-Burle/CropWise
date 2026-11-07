# Shared data pipeline — planned

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
- `test_prepare.py`: regression tests for leakage, duplicate handling and conflicting labels.

Use commands from `ml/data/README.md`. Both models must consume the same release and class map.
Perceptual/capture grouping is a heuristic, not proof that every physical leaf has been identified.
