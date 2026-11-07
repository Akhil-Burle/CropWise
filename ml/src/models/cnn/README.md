# CNN training

The first CNN implementation fine-tunes ImageNet-pretrained EfficientNet-B0 on the prepared
CropWise release `d053c9012200c857`. It reads the bundle's existing train/validation/test CSVs and
class map, applies augmentation to training images only, selects the checkpoint by validation
macro-F1, then evaluates the selected checkpoint once on the held-out test split.

## From a fresh clone

With Python 3.11+ and an internet connection, the one-command runner creates `ml/.venv`, installs
the data and training dependencies, downloads the pinned public dataset sources, verifies publisher
checksums, prepares and validates the shared release, then starts EfficientNet training:

```bash
python ml/run_cnn.py
```

The first setup downloads about **8.5 GB** and needs roughly **35–40 GB of free disk space** for
archives, extracted images and processing files. It may take a while; the download and fingerprint
steps can resume/reuse their existing files if interrupted. Subsequent runs reuse the prepared
release. For faster training, use a machine with a supported GPU. PyTorch and torchvision are
installed with pip defaults. For a specific CUDA, ROCm or Intel XPU build, choose the wheel index
from the official [PyTorch installer](https://pytorch.org/get-started/locally/) and pass it to the
runner with `--torch-index-url`.

For an Intel Arc GPU, first install a supported Intel graphics driver and check that the OS/GPU pair
is listed in the [PyTorch Intel GPU guide](https://docs.pytorch.org/docs/stable/notes/get_start_xpu.html).
Then run:

```bash
python ml/run_cnn.py --torch-index-url https://download.pytorch.org/whl/xpu
```

The runner installs the XPU wheels and `--device auto` selects Intel XPU when available. Initial
XPU training uses FP32 for compatibility; CUDA alone uses mixed precision currently. To select XPU
explicitly after setup, pass it through the one-command runner:
`python ml/run_cnn.py -- --device xpu`.

Use `python ml/run_cnn.py -- --epochs 3 --batch-size 8` to pass training options through. To train
without repeating environment or dataset setup, use `--skip-install --skip-data-setup` with an
existing `ml/.venv` and validated local release.

If an older checkout reports `ModuleNotFoundError` for the dataset module while starting DataLoader
workers, pull the latest `main` and rerun. As a temporary workaround, set workers to zero:
`python ml/run_cnn.py -- --num-workers 0`.

## Dataset distribution

The prepared 5.5 GB archive is not committed to Git. The fresh-clone runner above obtains the same
pinned source versions and builds the dataset locally, so a dataset upload is optional. If the team
chooses to distribute the prepared archive, GitHub blocks repository files above 100 MiB; GitHub
Release assets can be up to 2 GiB each, so split it into three assets. Keep the parts in one GitHub
Release and name them exactly like the split command below.

```bash
split -b 1800MiB --numeric-suffixes=0 --suffix-length=2 \
  ml/data/processed/cropwise-d053c9012200c857.tar.gz \
  ml/data/processed/cropwise-d053c9012200c857.tar.gz.part
```

Upload the resulting `.part00`, `.part01`, and `.part02` files as release assets. A collaborator can
then train from those assets; replace `OWNER/REPO` and `v0.1.0` with the published release URL:

```bash
python ml/src/models/cnn/train.py \
  --part-url-template \
  'https://github.com/OWNER/REPO/releases/download/v0.1.0/cropwise-d053c9012200c857.tar.gz.part{part}' \
  --part-count 3
```

The script downloads resumably, joins parts in order, checks the full archive byte count and SHA-256,
and extracts only regular files under `ml/data/training/d053c9012200c857/`. The default expected
digest and byte count are embedded for this release. If you already downloaded or extracted it:

```bash
python ml/src/models/cnn/train.py --archive ml/data/processed/cropwise-d053c9012200c857.tar.gz
# or
python ml/src/models/cnn/train.py --dataset-dir ml/data/training/d053c9012200c857
```

## Install and train

Use Python 3.11 or newer. Install PyTorch and torchvision from the official PyTorch selector for the
machine's OS and CPU/CUDA/ROCm/XPU hardware, then install the remaining dependencies:

```bash
python -m venv ml/.venv
# Activate ml/.venv using the command for your shell.
python -m pip install -r ml/requirements-data.txt
python -m pip install torch torchvision
python -m pip install -r ml/requirements-train.txt
python ml/src/models/cnn/train.py --dataset-dir ml/data/processed/releases/d053c9012200c857
```

The default run uses batch size 16, 20 maximum epochs, AdamW, early stopping, and selects CUDA, then
XPU, then CPU when available. Override settings such as `--batch-size`, `--epochs`, `--num-workers`,
`--device cpu`, `--device xpu`, `--seed`, or `--no-pretrained` as needed. A small CPU-only machine
will train slowly; use a supported GPU for practical training time.

The selected checkpoint, run metadata, epoch history, per-class metrics, and image-level test
predictions go under `ml/checkpoints/cnn/d053c9012200c857/`. The checkpoint directory is ignored by
Git. No model results are recorded until an actual training run completes. Test results are internal source-split results,
not a substitute for a separately collected field test. Publisher labels are experimental and are
not independently verified diagnoses.

To identify underrepresented/weak classes and find misclassified validation examples for manual
dataset review, run:

```bash
python ml/src/data/review_dataset.py
```

This evaluates the saved best checkpoint on validation data and writes `class_review.csv` and
`misclassified_validation.csv` beside the checkpoint. It never deletes or relabels images.

Before publishing dataset shards in a GitHub Release, review the source-specific license and
attribution requirements recorded in the dataset report and bundle metadata. The combined bundle
does not have one blanket license.
