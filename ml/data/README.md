# Local datasets and shared splits

See [dataset_catalog.csv](dataset_catalog.csv) for the expanded fruit/vegetable source shortlist and
[combination plan](../../docs/FRUIT_VEGETABLE_DATASETS.md). Entries are candidates, not downloaded or admitted training data.

Use `raw/` for source metadata, downloads and unchanged extracted images. `processed/releases/`
holds versioned manifests, audit reports and ImageFolder links. These generated directories are
ignored by Git. The selected source downloads and curated training release are complete; see the
[preparation report](../../docs/DATASET_PREPARATION_REPORT.md) for actual counts and exclusions.

Document sources, licenses, class counts, label mapping, split ID and manifest checksums in each run's metadata. Suggested manifest fields: `image_id,relative_path,label,source,group_id`. Both pipelines must use identical manifests. Group related images and remove duplicates before splitting. Obtain permission for farmer photos and avoid personal information in exported IDs.

## Run from the repository root

```bash
uv venv ml/.venv
uv pip install --python ml/.venv/bin/python -r ml/requirements-data.txt
ml/.venv/bin/python ml/src/data/download.py --discover
ml/.venv/bin/python ml/src/data/download.py --plan ml/configs/download_plan.json
ml/.venv/bin/python ml/src/data/extract.py
ml/.venv/bin/python ml/src/data/map_folders.py
# Review ml/configs/label_mapping.csv before proceeding with any new source.
ml/.venv/bin/python ml/src/data/prepare.py
ml/.venv/bin/python ml/src/data/validate.py
ml/.venv/bin/python -m unittest discover -s ml/src/data -p 'test_*.py'
```

The downloader stores completed chunks and can resume interrupted files. It never executes publisher
code. Original archive receipts contain download URL, timestamp, byte count and SHA-256. Publisher
metadata is preserved per source. A failed download is recorded in `raw/download_failures.json`.

Extraction skips supplied augmentation folders, non-image executable content, PlantVillage grayscale/
segmented variants and its corn/soybean classes. `map_folders.py` retains existing mapping decisions;
new, unknown folders are excluded rather than guessed. Organ-mixed sources require explicit review.
MangoLeafBD is held from training while original/derived-image lineage remains unresolved.
The generic citrus source is held because its host identity is not resolved to the same level as
the lemon source; overlapping genus/species labels would create an inconsistent classification task.

`prepare.py` keeps exact pixel duplicates once, preserves duplicate provenance in an audit CSV,
and groups perceptually similar inputs using rotation/flip-aware pHash with Hamming radius 2.
Visually similar groups with conflicting labels are quarantined. This is deliberately conservative;
similarity is not proof of duplication or label error. Quarantined files remain on disk for review.
Classes need at least 30 usable images and sufficient independent groups for all three splits.
By default a crop also needs both healthy and affected examples after class-level checks. Healthy-only
or affected-only crops stay in quarantine until adequate coverage is available; the optional
`--allow-incomplete-crops` switch is intended for explicitly scoped research experiments only.

Known PlantVillage leaf IDs and author test membership are preserved. A related group containing an
author test image is held entirely in test. Phone capture-minute groups are used where filenames
permit; remaining images use visual grouping. Physical leaf/farm IDs are not available for every source,
so external field evaluation is still required. Split ratios may differ from targets because groups
are indivisible and publisher test boundaries take precedence.

## Use the prepared release

`processed/latest.json` points to the current release. Each release contains:

- `train.csv`, `validation.csv`, `test.csv`, `manifest.csv` and `class_to_idx.json`.
- `class_counts.csv`, `summary.json`, `duplicates.csv`, `quarantine.csv` and `near_pairs.csv`.
- `imagefolder/{train,validation,test}/{class}/` with relative links to original images.

Paths in manifests are relative to `ml/`. Copy the original image tree along with manifests when moving
to a GPU machine; ImageFolder links alone do not contain image bytes. The loader in `src/data/dataset.py`
corrects EXIF orientation and converts to RGB. Supply the selected pretrained model's transforms;
apply stochastic augmentation only to training. CNN and ViT share image IDs and class IDs, while their
normalization can follow their respective pretrained weights. Do not rebalance validation/test or
create augmented examples before splitting.

Release IDs include source image hashes, label mappings, split membership, settings and pipeline hash.
Existing releases are not overwritten. Fingerprints are cached locally for subsequent source additions.
Download archives/chunks take extra space; retain raw images and provenance for reproducibility.

For a standalone bundle suitable for moving to a GPU machine:

```bash
ml/.venv/bin/python ml/src/data/export.py
ml/.venv/bin/python ml/src/data/report.py
```

This creates `processed/cropwise-<release_id>.tar.gz` and a SHA-256 sidecar. The bundle contains actual
image bytes, converted portable manifest paths, the shared class map, source metadata and a loader.
It includes only admitted images, preserving their original bytes. Unlike local ImageFolder links,
the bundle can be extracted and used independently of the raw download tree.

This collection includes disease, pest, deficiency and symptom labels. A symptom label does not establish
a pathogen, and publisher annotations have not been independently verified by an agronomist. Healthy-only
crops and crops without healthy examples are identified in each release summary. Source licenses stay
separate; no single redistribution license is implied.
