"""Create a standalone ImageFolder bundle, replacing local symlinks with actual image bytes."""
from __future__ import annotations

import argparse
import csv
import hashlib
import io
import json
from pathlib import Path
import tarfile

ML = Path(__file__).resolve().parents[2]


def add_bytes(archive, name, data):
    info = tarfile.TarInfo(name)
    info.size = len(data)
    info.mode = 0o644
    info.mtime = 0
    archive.addfile(info, io.BytesIO(data))


def csv_bytes(rows):
    stream = io.StringIO(newline='')
    fields = list(rows[0])
    writer = csv.DictWriter(stream, fieldnames=fields)
    writer.writeheader()
    writer.writerows(rows)
    return stream.getvalue().encode()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--release')
    parser.add_argument('--output')
    args = parser.parse_args()
    release = Path(args.release) if args.release else ML / json.loads((ML / 'data/processed/latest.json').read_text())['relative_path']
    summary = json.loads((release / 'summary.json').read_text())
    output = Path(args.output) if args.output else ML / 'data/processed' / f'cropwise-{summary["release_id"]}.tar.gz'
    if output.exists():
        raise SystemExit(f'Bundle already exists: {output}')
    temporary = output.with_name(output.name + '.part')
    partitions = {}
    for split in ['train', 'validation', 'test']:
        partitions[split] = list(csv.DictReader((release / f'{split}.csv').open()))
        for row in partitions[split]:
            row['source_relative_path'] = row['relative_path']
            row['relative_path'] = f'imagefolder/{split}/{row["label"]}/{row["image_id"]}{Path(row["source_relative_path"]).suffix.lower()}'
    output.parent.mkdir(parents=True, exist_ok=True)
    done = 0
    with tarfile.open(temporary, 'w:gz', compresslevel=1) as archive:
        for split, rows in partitions.items():
            add_bytes(archive, f'{split}.csv', csv_bytes(rows))
            for row in rows:
                data = (ML / row['source_relative_path']).read_bytes()
                if hashlib.sha256(data).hexdigest() != row['sha256']:
                    raise ValueError(f'Source image changed: {row["image_id"]}')
                add_bytes(archive, row['relative_path'], data)
                done += 1
                if done % 5000 == 0:
                    print(f'EXPORT {done}/{summary["images"]}', flush=True)
        for name in ['class_to_idx.json', 'summary.json', 'class_counts.csv', 'label_mapping.csv']:
            add_bytes(archive, name, (release / name).read_bytes())
        add_bytes(archive, 'dataset.py', (Path(__file__).parent / 'dataset.py').read_bytes())
        add_bytes(archive, 'README.txt', (
            'CropWise experimental training dataset\n'
            f'Release: {summary["release_id"]}\n'
            'Contains actual image bytes, not symlinks. No model has been trained.\n'
            'Use the SAME class map and split files for CNN and ViT.\n'
            'Apply model-specific preprocessing and training-only augmentation.\n'
            'CSV paths are relative to this extracted bundle; source_relative_path records provenance.\n'
            'With dataset.py use CropWiseDataset("train.csv", transform=..., ml_root=".").\n'
            'Install Pillow for the loader; install your chosen model training framework separately.\n'
            'Source licenses are separate; see source_metadata.json and attribution links.\n'
            'Publisher labels are not independently verified; symptom labels do not identify pathogens.\n'
            'Internal test data is not a substitute for external field evaluation.\n'
        ).encode())
        source_metadata = {}
        for source in summary['sources']:
            metadata = ML / 'data/raw' / source / 'metadata'
            for name in ['snapshot.json', 'repository.json']:
                if (metadata / name).exists():
                    source_metadata[source] = json.loads((metadata / name).read_text())
        add_bytes(archive, 'source_metadata.json', json.dumps(source_metadata, indent=2).encode())
    temporary.rename(output)
    digest = hashlib.sha256()
    with output.open('rb') as stream:
        while block := stream.read(1024 * 1024):
            digest.update(block)
    output.with_name(output.name + '.sha256').write_text(f'{digest.hexdigest()}  {output.name}\n')
    print(f'BUNDLE {output} ({output.stat().st_size} bytes); SHA256={digest.hexdigest()}', flush=True)


if __name__ == '__main__':
    main()
