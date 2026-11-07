"""One-command setup: create an environment, prepare the pinned dataset, and train the CNN."""
from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import subprocess
import sys
import venv


ML = Path(__file__).resolve().parent
ROOT = ML.parent


def command(args, cwd=ROOT):
    print("\n$ " + " ".join(map(str, args)), flush=True)
    subprocess.run(list(map(str, args)), cwd=cwd, check=True)


def environment_python() -> Path:
    return ML / ".venv" / ("Scripts/python.exe" if os.name == "nt" else "bin/python")


def install_environment(torch_index_url: str | None = None) -> Path:
    python = environment_python()
    if not python.exists():
        print("Creating ml/.venv", flush=True)
        venv.EnvBuilder(with_pip=True).create(python.parent.parent if os.name != "nt" else python.parent.parent)
    command([python, "-m", "pip", "install", "-r", ML / "requirements-data.txt"])
    has_torch = subprocess.run(
        [str(python), "-c", "import torch, torchvision"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
    ).returncode == 0
    if not has_torch or torch_index_url:
        print("Installing PyTorch and torchvision", flush=True)
        install_torch = [python, "-m", "pip", "install", "torch", "torchvision"]
        if torch_index_url:
            install_torch.extend(["--index-url", torch_index_url, "--force-reinstall"])
        command(install_torch)
    command([python, "-m", "pip", "install", "-r", ML / "requirements-train.txt"])
    return python


def prepared_release(python: Path) -> tuple[str, Path] | None:
    pointer = ML / "data" / "processed" / "latest.json"
    if not pointer.exists():
        return None
    info = json.loads(pointer.read_text())
    folder = ML / info["relative_path"]
    needed = ["summary.json", "train.csv", "validation.csv", "test.csv", "class_to_idx.json", "imagefolder"]
    if not all((folder / name).exists() for name in needed):
        return None
    checked = subprocess.run([str(python), ML / "src" / "data" / "validate.py", "--release", folder])
    if checked.returncode:
        return None
    return info["release_id"], folder


def prepare_dataset(python: Path) -> tuple[str, Path]:
    existing = prepared_release(python)
    if existing:
        print(f"Using validated dataset release {existing[0]}", flush=True)
        return existing

    print(
        "Preparing the pinned dataset from public sources. This downloads about 8.5 GB of source "
        "archives and needs roughly 35–40 GB of free disk space for extraction and processing.",
        flush=True,
    )
    data_script = ML / "src" / "data"
    command([python, data_script / "download.py", "--discover"])
    command([python, data_script / "download.py", "--plan", ML / "configs" / "download_plan.json"])
    command([python, data_script / "extract.py"])
    command([python, data_script / "map_folders.py"])
    command([python, data_script / "prepare.py"])
    pointer = ML / "data" / "processed" / "latest.json"
    info = json.loads(pointer.read_text())
    folder = ML / info["relative_path"]
    command([python, data_script / "validate.py", "--release", folder])
    return info["release_id"], folder


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--skip-install", action="store_true", help="Use ml/.venv or the current Python as-is")
    parser.add_argument("--skip-data-setup", action="store_true", help="Require an already prepared local release")
    parser.add_argument("--dataset-dir", type=Path, help="Use an already extracted standalone dataset bundle")
    parser.add_argument("--archive", type=Path, help="Use an already downloaded complete dataset archive")
    parser.add_argument("--dataset-url", help="Download a complete dataset archive from this URL")
    parser.add_argument("--part-url-template", help="Download split archive assets; URL must contain {part}")
    parser.add_argument("--part-count", type=int, default=3)
    parser.add_argument("--torch-index-url", help="Optional PyTorch wheel index from the official installer (CUDA/ROCm/XPU)")
    args, training_args = parser.parse_known_args()
    if sys.version_info < (3, 11):
        raise SystemExit("Python 3.11 or newer is required for the pinned ML dependencies.")
    python = environment_python() if args.skip_install and environment_python().exists() else Path(sys.executable)
    if not args.skip_install:
        python = install_environment(args.torch_index_url)

    train = ML / "src" / "models" / "cnn" / "train.py"
    if args.dataset_dir or args.archive or args.dataset_url or args.part_url_template:
        train_command = [python, train]
        for name in ("dataset_dir", "archive", "dataset_url", "part_url_template"):
            value = getattr(args, name)
            if value is not None:
                train_command.extend(["--" + name.replace("_", "-"), value])
        if args.part_url_template:
            train_command.extend(["--part-count", args.part_count])
    else:
        if args.skip_data_setup:
            ready = prepared_release(python)
            if not ready:
                raise SystemExit("No validated local dataset release found; remove --skip-data-setup to prepare it.")
        else:
            ready = prepare_dataset(python)
        release_id, folder = ready
        train_command = [python, train, "--release", release_id, "--dataset-dir", folder]
    if training_args:
        train_command.extend(training_args)
    command(train_command)


if __name__ == "__main__":
    main()
