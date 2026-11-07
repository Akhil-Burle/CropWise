"""Build reproducible, source-traceable, duplicate-grouped manifests for both classifiers."""
from __future__ import annotations

import argparse
from collections import Counter, defaultdict
from concurrent.futures import ThreadPoolExecutor
import csv
import hashlib
from importlib.metadata import version as package_version
import inspect
import json
from pathlib import Path
import random
import re
import sqlite3

import imagehash
from PIL import Image, ImageOps

ML = Path(__file__).resolve().parents[2]
RAW = ML / 'data/raw'
PROCESSED = ML / 'data/processed'
EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tif', '.tiff'}
Image.MAX_IMAGE_PIXELS = 50_000_000


def write_csv(path, rows, fields):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open('w', newline='') as stream:
        writer = csv.DictWriter(stream, fieldnames=fields, extrasaction='ignore')
        writer.writeheader()
        writer.writerows(rows)


class UnionFind:
    def __init__(self, count):
        self.parents = list(range(count))

    def find(self, index):
        while self.parents[index] != index:
            self.parents[index] = self.parents[self.parents[index]]
            index = self.parents[index]
        return index

    def union(self, left, right):
        a, b = self.find(left), self.find(right)
        if a != b:
            self.parents[max(a, b)] = min(a, b)


class BKTree:
    def __init__(self):
        self.root = None

    def add(self, value, index):
        if self.root is None:
            self.root = (value, index, {})
            return
        node = self.root
        while True:
            distance = (value ^ node[0]).bit_count()
            if distance == 0:
                return
            if distance not in node[2]:
                node[2][distance] = (value, index, {})
                return
            node = node[2][distance]

    def query(self, value, radius):
        found, pending = [], [self.root] if self.root else []
        while pending:
            node = pending.pop()
            distance = (value ^ node[0]).bit_count()
            if distance <= radius:
                found.append((distance, node[1]))
            pending.extend(child for edge, child in node[2].items()
                           if distance - radius <= edge <= distance + radius)
        return found


def fingerprint(path):
    try:
        file_hash = hashlib.sha256()
        with path.open('rb') as stream:
            while block := stream.read(1024 * 1024):
                file_hash.update(block)
        with Image.open(path) as image:
            image.load()  # Fully decode to catch truncated/corrupt inputs.
            image = ImageOps.exif_transpose(image).convert('RGB')
            width, height = image.size
            if min(width, height) < 64:
                return {'error': 'image_smaller_than_64px'}
            pixels = hashlib.sha256(f'{width}x{height}:'.encode() + image.tobytes()).hexdigest()
            image.thumbnail((256, 256), Image.Resampling.LANCZOS)
            hashes = []
            for transpose in [None, Image.Transpose.ROTATE_90, Image.Transpose.ROTATE_180,
                              Image.Transpose.ROTATE_270, Image.Transpose.FLIP_LEFT_RIGHT,
                              Image.Transpose.FLIP_TOP_BOTTOM, Image.Transpose.TRANSPOSE,
                              Image.Transpose.TRANSVERSE]:
                variant = image if transpose is None else image.transpose(transpose)
                hashes.append(str(imagehash.phash(variant)))
            return {'sha256': file_hash.hexdigest(), 'pixel_sha256': pixels,
                    'phash': min(hashes), 'width': width, 'height': height,
                    'error': ''}
    except Exception as error:
        return {'error': f'{type(error).__name__}: {error}'}


def cache_signature():
    versions = {name: package_version(name) for name in ['Pillow', 'numpy', 'ImageHash', 'scipy']}
    return hashlib.sha256((inspect.getsource(fingerprint) + json.dumps(versions, sort_keys=True)).encode()).hexdigest()[:12]


def known_groups():
    folder = RAW / 'plantvillage/downloads'
    mapping_path = folder / 'leaf_grouping__leaf-map.json'
    mapping = json.loads(mapping_path.read_text()) if mapping_path.exists() else {}
    official = {}
    for split in ['train', 'test']:
        path = folder / f'splits__color_{split}.txt'
        if path.exists():
            for line in path.read_text().splitlines():
                official['/'.join(line.split('/')[-2:])] = split
    return mapping, official


def capture_group(source, path, label, leaf_map):
    if source == 'plantvillage':
        identifier = path.name.replace('_final_masked', '').split('___')[-1]
        identifier = identifier.split('copy')[0]
        identifier = re.sub(r'\.(jpg|jpeg|png)$', '', identifier, flags=re.I).strip()
        suggestions = leaf_map.get(identifier.lower(), [])
        match = next((value for value in suggestions if path.parent.name in value), None)
        if not match and len(suggestions) == 1:
            match = suggestions[0]
        return source + ':' + (match or 'fallback:' + identifier.lower())
    # Crop+source+capture-minute grouping is conservative where phone filenames expose time.
    # It does not establish biological leaf/plant identity; unknown groups remain explicit below.
    match = re.search(r'(?:IMG[_-]?)?(20\d{6})[_-](\d{4})\d{2}', path.stem, re.I)
    if match:
        return f'{source}:capture_minute:{label.split("__")[0]}:{match[1]}:{match[2]}'
    return ''


def assign_splits(rows, seed=42, radius=2, minimum=30):
    """Exact duplicates collapse; related/perceptually similar images share one partition."""
    uf, exact, pixels, groups = UnionFind(len(rows)), {}, {}, {}
    tree = BKTree()
    hash_index = {}
    near_pairs = []
    for index, row in enumerate(rows):
        for values, key in [(exact, row['sha256']), (pixels, row['pixel_sha256'])]:
            if key in values:
                uf.union(index, values[key])
            else:
                values[key] = index
        if row.get('capture_group'):
            key = row['capture_group']
            if key in groups:
                uf.union(index, groups[key])
            else:
                groups[key] = index
        value = int(row['phash'], 16)
        if value in hash_index:
            other = hash_index[value]
            uf.union(index, other)
            near_pairs.append((index, other, 0))
        else:
            for distance, other in tree.query(value, radius):
                uf.union(index, other)
                near_pairs.append((index, other, distance))
            hash_index[value] = index
            tree.add(value, index)
    connected = defaultdict(list)
    for index in range(len(rows)):
        connected[uf.find(index)].append(index)
    quarantined, duplicates, retained = [], [], []
    for members in connected.values():
        labels = {rows[i]['label'] for i in members}
        # Time-based capture groups may validly contain several labels. Only a visual duplicate
        # edge with differing labels is a label conflict; do not reject merely co-captured leaves.
        visual_conflict = False
        if len(labels) > 1:
            for index in members:
                for lookup, key in [(exact, rows[index]['sha256']), (pixels, rows[index]['pixel_sha256'])]:
                    if rows[lookup[key]]['label'] != rows[index]['label']:
                        visual_conflict = True
            member_set = set(members)
            if any(rows[a]['label'] != rows[b]['label'] for a,b,_ in near_pairs if a in member_set and b in member_set):
                visual_conflict = True
        group_id = hashlib.sha256('|'.join(sorted(rows[i]['image_id'] for i in members)).encode()).hexdigest()[:20]
        # Mixed-label capture groups are kept together by splitting on their group ID globally.
        for index in members:
            rows[index]['group_id'] = group_id
        if visual_conflict:
            for index in members:
                quarantined.append({**rows[index], 'reason': 'visual_similarity_label_conflict'})
            continue
        seen = {}
        for index in sorted(members, key=lambda i: (rows[i]['official_split'] != 'test', rows[i]['image_id'])):
            row = rows[index]
            key = row['pixel_sha256']
            if key in seen:
                duplicates.append({**row, 'duplicate_of': seen[key]['image_id']})
            else:
                seen[key] = row
                retained.append(row)
        # An original test member makes the complete related group test-only.
        if any(rows[i]['official_split'] == 'test' for i in members):
            for row in seen.values():
                row['official_split'] = 'test'
    by_class = defaultdict(list)
    for row in retained:
        by_class[row['label']].append(row)
    active = []
    for label, items in sorted(by_class.items()):
        available = {r['group_id'] for r in items if r['official_split'] != 'test'}
        all_groups = {r['group_id'] for r in items}
        if len(items) < minimum or len(available) < 3 or len(all_groups) < 5:
            quarantined.extend({**r, 'reason': 'insufficient_independent_examples'} for r in items)
        else:
            active.extend(items)
    global_groups = defaultdict(list)
    for row in active:
        global_groups[row['group_id']].append(row)
    totals = Counter(r['label'] for r in active)
    counts = {part: Counter() for part in ['train', 'validation', 'test']}
    assigned = {}
    for group_id, items in global_groups.items():
        if any(r['official_split'] == 'test' for r in items):
            assigned[group_id] = 'test'
            counts['test'].update(r['label'] for r in items)
    remaining = [(key, items) for key, items in sorted(global_groups.items()) if key not in assigned]
    random.Random(seed).shuffle(remaining)
    remaining.sort(key=lambda pair: -len(pair[1]))
    for group_id, items in remaining:
        labels = Counter(r['label'] for r in items)
        # Fill missing partitions first, then minimize normalized deviation from target counts.
        def cost(part):
            score = 0.0
            for label, amount in labels.items():
                targets = {'train': .70, 'validation': .15, 'test': .15}
                if any(r['dataset_id'] == 'plantvillage' for r in by_class[label]):
                    targets = {'train': .68, 'validation': .12, 'test': .20}
                if part == 'test' and any(r['official_split'] == 'test' for r in by_class[label]):
                    score += 100  # Preserve the publisher test boundary; no new test groups.
                score += amount * (counts[part][label] / max(1, totals[label] * targets[part]))
                if counts[part][label] == 0:
                    score -= 10
            return score
        selected = min(['train', 'validation', 'test'], key=cost)
        assigned[group_id] = selected
        counts[selected].update(labels)
    for row in active:
        row['split'] = assigned[row['group_id']]
    # Never publish a trainable class without an evaluation sample in every partition.
    incomplete = {label for label in totals if any(counts[part][label] == 0 for part in counts)}
    final = []
    for row in active:
        if row['label'] in incomplete:
            quarantined.append({**row, 'reason': 'class_missing_partition'})
        else:
            final.append(row)
    return final, quarantined, duplicates, near_pairs


FIELDS = ['image_id', 'relative_path', 'label', 'crop_id', 'organ', 'condition_type',
          'dataset_id', 'source_version', 'source_label', 'license', 'width', 'height',
          'sha256', 'pixel_sha256', 'phash', 'capture_group', 'group_id', 'official_split',
          'annotation_status', 'split']


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--mapping', default=str(ML / 'configs/label_mapping.csv'))
    parser.add_argument('--workers', type=int, default=2)
    parser.add_argument('--seed', type=int, default=42)
    parser.add_argument('--near-radius', type=int, default=2)
    parser.add_argument('--minimum-class-images', type=int, default=30)
    parser.add_argument('--allow-incomplete-crops', action='store_true',
                        help='Research-only: retain crops missing healthy or affected examples')
    args = parser.parse_args()
    rules = list(csv.DictReader(Path(args.mapping).open()))
    mapping = {(r['dataset_id'], r['relative_folder']): r for r in rules}
    metadata = {}
    for source in RAW.iterdir():
        path = source / 'metadata/snapshot.json'
        if path.exists():
            snapshot = json.loads(path.read_text())
            metadata[source.name] = {'version': str(snapshot['version']),
                                     'license': snapshot['licence'].get('short_name', str(snapshot['licence']))}
    metadata['plantvillage'] = {'version': json.loads((RAW / 'plantvillage/metadata/repository.json').read_text())['sha'],
                               'license': 'CC BY-SA 3.0'}
    leaf_map, official = known_groups()
    PROCESSED.mkdir(parents=True, exist_ok=True)
    cache = sqlite3.connect(PROCESSED / f'fingerprints-{cache_signature()}.sqlite')
    cache.execute('CREATE TABLE IF NOT EXISTS images (path TEXT PRIMARY KEY, size INT, mtime INT, result TEXT)')
    pending, cached, skipped = [], [], []
    for path in sorted(RAW.glob('*/images/**/*')):
        if path.suffix.lower() not in EXTENSIONS:
            continue
        source = path.relative_to(RAW).parts[0]
        folder = path.parent.relative_to(RAW / source / 'images').as_posix()
        rule = mapping.get((source, folder))
        if not rule or rule['admit'] != 'yes':
            skipped.append({'relative_path': path.relative_to(ML).as_posix(), 'dataset_id': source,
                            'reason': rule['reason'] if rule else 'unmapped_source_folder'})
            continue
        relative = path.relative_to(ML).as_posix()
        identity = hashlib.sha256((source + ':' + relative).encode()).hexdigest()[:24]
        row = {'image_id': identity, 'relative_path': relative, 'label': rule['label'],
               'crop_id': rule['crop_id'], 'organ': rule['organ'], 'condition_type': rule['condition_type'],
               'dataset_id': source, 'source_version': metadata[source]['version'],
               'license': metadata[source]['license'], 'source_label': path.parent.name,
               'capture_group': capture_group(source, path, rule['label'], leaf_map),
               'official_split': official.get('/'.join(path.parts[-2:]), '') if source == 'plantvillage' else '',
               'annotation_status': 'publisher_label_not_independently_verified'}
        stat = path.stat()
        hit = cache.execute('SELECT result FROM images WHERE path=? AND size=? AND mtime=?',
                            (relative, stat.st_size, stat.st_mtime_ns)).fetchone()
        if hit:
            cached.append((row, json.loads(hit[0])))
        else:
            pending.append((row, path, stat.st_size, stat.st_mtime_ns))
    print(f'INDEX cached={len(cached)} new={len(pending)} excluded={len(skipped)}', flush=True)
    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        for index, ((row, path, size, mtime), result) in enumerate(zip(pending, pool.map(fingerprint, (item[1] for item in pending)))):
            cache.execute('INSERT OR REPLACE INTO images VALUES (?,?,?,?)',
                          (row['relative_path'], size, mtime, json.dumps(result)))
            cached.append((row, result))
            if index % 500 == 0:
                cache.commit()
                print(f'FINGERPRINT {index + 1}/{len(pending)}', flush=True)
    cache.commit()
    cache.close()
    rows = []
    for row, result in cached:
        if result.get('error'):
            skipped.append({**row, 'reason': result['error']})
        else:
            rows.append({**row, **result})
    rows.sort(key=lambda r: r['image_id'])
    final, quarantine, duplicates, near = assign_splits(rows, args.seed, args.near_radius, args.minimum_class_images)
    coverage = defaultdict(set)
    for row in final:
        coverage[row['crop_id']].add(row['condition_type'])
    incomplete_crops = sorted(crop for crop, types in coverage.items()
                              if 'healthy' not in types or types == {'healthy'})
    if not args.allow_incomplete_crops:
        quarantine.extend({**row, 'reason': 'crop_requires_healthy_and_affected_examples'}
                          for row in final if row['crop_id'] in incomplete_crops)
        final = [row for row in final if row['crop_id'] not in incomplete_crops]
    if not final:
        raise SystemExit('No usable classes survived admission checks; review quarantine and label mapping.')
    settings = {'seed': args.seed, 'near_radius': args.near_radius, 'minimum_class_images': args.minimum_class_images,
                'allow_incomplete_crops': args.allow_incomplete_crops,
                'software_versions': {name: package_version(name) for name in ['Pillow', 'numpy', 'ImageHash', 'scipy']},
                'pipeline_sha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
                'mapping_sha256': hashlib.sha256(Path(args.mapping).read_bytes()).hexdigest(),
                'source_metadata': {key: value for key, value in sorted(metadata.items())}}
    version = hashlib.sha256(json.dumps({'settings': settings,
        'rows': [(r['image_id'], r['sha256'], r['label'], r['group_id'], r['split']) for r in final]}, sort_keys=True).encode()).hexdigest()[:16]
    out = PROCESSED / 'releases' / version
    if out.exists():
        raise SystemExit(f'Release {version} already exists. No files overwritten.')
    out.mkdir(parents=True)
    labels = sorted({r['label'] for r in final})
    class_map = {label: index for index, label in enumerate(labels)}
    (out / 'class_to_idx.json').write_text(json.dumps(class_map, indent=2) + '\n')
    (out / 'label_mapping.csv').write_bytes(Path(args.mapping).read_bytes())
    for split in ['train', 'validation', 'test']:
        selected = sorted((r for r in final if r['split'] == split), key=lambda r: (r['label'], r['image_id']))
        write_csv(out / f'{split}.csv', selected, FIELDS)
        for row in selected:
            link = out / 'imagefolder' / split / row['label'] / (row['image_id'] + Path(row['relative_path']).suffix.lower())
            link.parent.mkdir(parents=True, exist_ok=True)
            # Relative links keep the entire ml/ tree relocatable.
            import os
            link.symlink_to(os.path.relpath(ML / row['relative_path'], link.parent))
    write_csv(out / 'manifest.csv', final, FIELDS)
    write_csv(out / 'quarantine.csv', quarantine + skipped, FIELDS + ['reason'])
    write_csv(out / 'duplicates.csv', duplicates, FIELDS + ['duplicate_of'])
    write_csv(out / 'near_pairs.csv', [{'left': rows[a]['image_id'], 'right': rows[b]['image_id'], 'distance': distance}
                                      for a,b,distance in near], ['left', 'right', 'distance'])
    counts = Counter((r['label'], r['split']) for r in final)
    write_csv(out / 'class_counts.csv', [{'label': label, 'train': counts[label,'train'],
        'validation': counts[label,'validation'], 'test': counts[label,'test']} for label in labels],
        ['label', 'train', 'validation', 'test'])
    crop_conditions = defaultdict(set)
    for row in final:
        crop_conditions[row['crop_id']].add(row['label'].split('__')[-1])
    summary = {'release_id': version, 'images': len(final), 'classes': len(labels),
        'crops': sorted(crop_conditions), 'sources': dict(Counter(r['dataset_id'] for r in final)),
        'splits': dict(Counter(r['split'] for r in final)), 'quarantine': len(quarantine) + len(skipped),
        'exact_pixel_duplicates_removed': len(duplicates), 'near_similarity_edges': len(near),
        'incomplete_crops_held_from_training': incomplete_crops if not args.allow_incomplete_crops else [],
        'healthy_only_crops': sorted(crop for crop, conditions in crop_conditions.items() if conditions == {'healthy'}),
        'crops_without_healthy_examples': sorted(crop for crop, conditions in crop_conditions.items() if 'healthy' not in conditions),
        'settings': settings,
        'limitations': ['Publisher labels have not been independently verified by an agronomist.',
                       'Near-duplicate hashing and capture-minute heuristics do not establish complete plant identity.',
                       'Internal holdout scores will not establish accuracy on local farmer field photos.',
                       'Source-specific licenses remain in force; no unified redistribution license is granted.']}
    (out / 'summary.json').write_text(json.dumps(summary, indent=2) + '\n')
    (PROCESSED / 'latest.json').write_text(json.dumps({'release_id': version, 'relative_path': f'data/processed/releases/{version}'}, indent=2) + '\n')
    print(json.dumps(summary, indent=2), flush=True)


if __name__ == '__main__':
    main()
