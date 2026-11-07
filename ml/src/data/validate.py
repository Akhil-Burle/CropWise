"""Check manifest partitions, duplicates, class IDs and usable image links."""
import argparse
from collections import defaultdict
import csv
import hashlib
import json
from pathlib import Path
from datetime import datetime, timezone

from PIL import Image, ImageOps

ML = Path(__file__).resolve().parents[2]


def validate(folder, full=False):
    class_map = json.loads((folder / 'class_to_idx.json').read_text())
    assert sorted(class_map.values()) == list(range(len(class_map))), 'Noncontiguous class IDs'
    seen = {key: {} for key in ['image_id', 'sha256', 'pixel_sha256', 'group_id']}
    labels = defaultdict(set)
    count = 0
    for split in ['train', 'validation', 'test']:
        rows = list(csv.DictReader((folder / f'{split}.csv').open()))
        assert rows, f'Empty split: {split}'
        for index, row in enumerate(rows):
            assert row['split'] == split
            assert row['label'] in class_map
            assert row['organ'] == 'leaf'
            assert row['official_split'] != 'test' or split == 'test', 'Publisher test image leaked'
            for key, values in seen.items():
                value = row[key]
                assert value not in values or (key == 'group_id' and values[value] == split), f'{key} leakage/duplicate: {value}'
                values[value] = split
            image_path = ML / row['relative_path']
            assert image_path.is_file(), image_path
            link = folder / 'imagefolder' / split / row['label'] / (row['image_id'] + image_path.suffix.lower())
            assert link.is_symlink() and link.resolve() == image_path.resolve(), 'Broken/misdirected image link'
            if full or index % 500 == 0:
                assert hashlib.sha256(image_path.read_bytes()).hexdigest() == row['sha256'], 'Source image changed'
                with Image.open(image_path) as image:
                    image.load()
                    image = ImageOps.exif_transpose(image).convert('RGB')
                    assert image.size == (int(row['width']), int(row['height']))
            labels[row['label']].add(split)
            count += 1
    assert all(parts == {'train', 'validation', 'test'} for parts in labels.values()), 'Class missing partition'
    summary = json.loads((folder / 'summary.json').read_text())
    assert count == summary['images']
    assert len(labels) == summary['classes']
    (folder / 'validation.json').write_text(json.dumps({
        'status': 'passed', 'checked_at': datetime.now(timezone.utc).isoformat(),
        'release_id': summary['release_id'], 'images': count, 'classes': len(labels),
        'partition_and_file_presence_checks': 'all_rows',
        'source_hash_and_decode_checks': 'all_images' if full else 'every_500th_image_per_partition',
        'validator_sha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
    }, indent=2) + '\n')
    print(f'PASS: {count} images, {len(labels)} classes; no exact/pixel/group overlap across partitions.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--release')
    parser.add_argument('--full', action='store_true')
    args = parser.parse_args()
    folder = Path(args.release) if args.release else ML / json.loads((ML / 'data/processed/latest.json').read_text())['relative_path']
    validate(folder, args.full)
