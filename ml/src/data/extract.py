"""Extract images without executing publisher code; inventory source folders before label mapping."""
from __future__ import annotations

from collections import Counter
import csv
import hashlib
import json
from pathlib import Path, PurePosixPath
import stat
import zipfile

ML = Path(__file__).resolve().parents[2]
RAW = ML / 'data/raw'
EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tif', '.tiff'}


def allowed(source, name):
    parts = PurePosixPath(name.replace('\\', '/')).parts
    lowered = [p.lower() for p in parts]
    if any(p in {'..', '__macosx'} or p.startswith('.') for p in lowered):
        return False
    if source == 'plantvillage':
        if 'color' not in lowered:
            return False
        if any(p.startswith(('Corn_', 'Soybean_')) for p in parts):
            return False
    # Author-supplied augmented variants are excluded, even when bundled in one archive.
    if any('augment' in p for p in lowered):
        return False
    return True


def extract_one(source, archive, dest):
    marker = dest / '.extraction.json'
    if marker.exists():
        return
    count, skipped = 0, Counter()
    with zipfile.ZipFile(archive) as bundle:
        for entry in bundle.infolist():
            name = entry.filename.replace('\\', '/')
            relative = PurePosixPath(name)
            if relative.is_absolute() or '..' in relative.parts:
                raise ValueError(f'Unsafe archive path: {name}')
            if stat.S_ISLNK(entry.external_attr >> 16):
                raise ValueError(f'Archive symlink refused: {name}')
            if entry.is_dir():
                continue
            if not allowed(source, name):
                skipped['excluded_path'] += 1
                continue
            suffix = relative.suffix.lower()
            if suffix not in EXTENSIONS and suffix not in {'.zip', '.csv', '.json', '.txt', '.md'}:
                skipped['non_image_or_metadata'] += 1
                continue
            if entry.file_size > 300_000_000:
                skipped['oversized_member'] += 1
                continue
            out = dest.joinpath(*relative.parts)
            if not out.resolve().is_relative_to(dest.resolve()):
                raise ValueError('Extraction escaped destination')
            out.parent.mkdir(parents=True, exist_ok=True)
            with bundle.open(entry) as incoming, out.open('wb') as target:
                while block := incoming.read(1024 * 1024):
                    target.write(block)
            if suffix in EXTENSIONS:
                count += 1
    # Some source bundles contain original images in nested ZIPs.
    for nested in sorted(dest.rglob('*.zip')):
        extract_one(source, nested, nested.with_suffix(''))
    dest.mkdir(parents=True, exist_ok=True)
    marker.write_text(json.dumps({'archive': str(archive.relative_to(ML)),
                                  'images': count, 'skipped': dict(skipped)}, indent=2) + '\n')
    print(f'EXTRACTED {source}: {count} images from {archive.name}; skipped={dict(skipped)}', flush=True)


def main():
    for source in sorted(RAW.iterdir()):
        if not source.is_dir():
            continue
        for archive in sorted((source / 'downloads').glob('*.zip')):
            receipt = archive.with_name(archive.name + '.receipt.json')
            if not receipt.exists():
                raise ValueError(f'Unverified archive: {archive}')
            fingerprint = json.loads(receipt.read_text())['sha256'][:12]
            extract_one(source.name, archive, source / 'images' / fingerprint)
    counts = Counter()
    for source in sorted(RAW.iterdir()):
        if not source.is_dir():
            continue
        for image in (source / 'images').rglob('*'):
            if image.suffix.lower() in EXTENSIONS:
                counts[(source.name, image.parent.relative_to(source / 'images').as_posix())] += 1
    out = ML / 'data/processed'
    out.mkdir(parents=True, exist_ok=True)
    with (out / 'folder_inventory.csv').open('w', newline='') as stream:
        writer = csv.writer(stream)
        writer.writerow(['dataset_id', 'relative_folder', 'images'])
        writer.writerows((*key, count) for key, count in sorted(counts.items()))
    print(f'INVENTORY {sum(counts.values())} images in {len(counts)} source folders', flush=True)


if __name__ == '__main__':
    main()
