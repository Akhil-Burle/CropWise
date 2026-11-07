"""Record the completed dataset release and local acquisition status for college review."""
from collections import Counter, defaultdict
import csv
import hashlib
import json
from pathlib import Path
import platform

ML = Path(__file__).resolve().parents[2]
ROOT = ML.parent


def main():
    pointer = json.loads((ML / 'data/processed/latest.json').read_text())
    release = ML / pointer['relative_path']
    summary = json.loads((release / 'summary.json').read_text())
    validation = json.loads((release / 'validation.json').read_text())
    assert validation['status'] == 'passed'
    rows = list(csv.DictReader((release / 'manifest.csv').open()))
    inventory = list(csv.DictReader((ML / 'data/processed/folder_inventory.csv').open()))
    quarantine = list(csv.DictReader((release / 'quarantine.csv').open()))
    source_downloads = {}
    for source in (ML / 'data/raw').iterdir():
        if not source.is_dir():
            continue
        receipts = []
        for archive in (source / 'downloads').glob('*.zip'):
            receipt = json.loads(archive.with_name(archive.name + '.receipt.json').read_text())
            assert receipt['publisher_hash_verified']
            assert archive.stat().st_size == receipt['bytes']
            receipts.append(receipt)
        if receipts:
            source_downloads[source.name] = receipts
    bundle = ML / 'data/processed' / f'cropwise-{summary["release_id"]}.tar.gz'
    assert bundle.exists() and bundle.with_name(bundle.name + '.sha256').exists(), 'Export bundle first'
    bundle_hash = bundle.with_name(bundle.name + '.sha256').read_text().split()[0]
    crop_rows = defaultdict(list)
    for row in rows:
        crop_rows[row['crop_id']].append(row)
    reasons = Counter(row['reason'] for row in quarantine)
    conditions = Counter(row['condition_type'] for row in rows)
    receipts = {source: [{'sha256': r['sha256'], 'bytes': r['bytes'], 'url': r['url']}
                        for r in values] for source, values in source_downloads.items()}
    prepared = {
        'status': 'prepared_for_experimental_training_models_not_trained',
        'python_version': platform.python_version(),
        'release_id': summary['release_id'], 'images': summary['images'],
        'classes': summary['classes'], 'crop_ids': summary['crops'], 'splits': summary['splits'],
        'downloaded_sources': len(source_downloads),
        'archive_bytes': sum(r['bytes'] for values in source_downloads.values() for r in values),
        'bundle_path': str(bundle.relative_to(ML)), 'bundle_bytes': bundle.stat().st_size,
        'bundle_sha256': bundle_hash,
        'manifest_paths': {split: str((release / f'{split}.csv').relative_to(ML))
                           for split in ['train', 'validation', 'test']},
        'manifest_sha256': {split: hashlib.sha256((release / f'{split}.csv').read_bytes()).hexdigest()
                           for split in ['train', 'validation', 'test']},
        'class_map': str((release / 'class_to_idx.json').relative_to(ML)),
        'source_downloads': receipts,
    }
    (ML / 'configs/prepared_dataset.json').write_text(json.dumps(prepared, indent=2) + '\n')
    config_path = ML / 'configs/comparison.json'
    config = json.loads(config_path.read_text())
    config['status'] = 'dataset_prepared_training_specification_not_executable'
    config['dataset'].update(name='CropWise curated fruit and vegetable leaf corpus',
        label_map=prepared['class_map'], split_id=summary['release_id'],
        manifest_paths=prepared['manifest_paths'], images=summary['images'], classes=summary['classes'],
        prepared_bundle=prepared['bundle_path'])
    config_path.write_text(json.dumps(config, indent=2) + '\n')
    catalog_path = ML / 'data/dataset_catalog.csv'
    with catalog_path.open() as stream:
        reader = csv.DictReader(stream)
        fields = list(reader.fieldnames)
        catalog = list(reader)
    for field in ['download_status', 'training_admission', 'admitted_images']:
        if field not in fields:
            fields.append(field)
    for entry in catalog:
        source = entry['dataset_id']
        count = summary['sources'].get(source, 0)
        entry.update(download_status='checksum_verified' if source in source_downloads else 'not_selected_for_this_release',
                     training_admission='included' if count else 'held_or_not_selected', admitted_images=str(count))
    with catalog_path.open('w', newline='') as stream:
        writer = csv.DictWriter(stream, fieldnames=fields)
        writer.writeheader()
        writer.writerows(catalog)
    lines = [
        '# CropWise dataset preparation report', '',
        f'Release: `{summary["release_id"]}`. Status: **prepared for CNN and ViT experiments; no models trained**.', '',
        f'- Downloaded **{len(source_downloads)} selected sources**, totaling **{prepared["archive_bytes"]:,} archive bytes**.',
        '- Each downloaded archive passed its publisher-provided SHA-256 check. Source metadata, versions, licenses and receipts remain under `ml/data/raw/`.',
        f'- Extracted **{sum(int(row["images"]) for row in inventory):,} candidate image files** after archive-level exclusions. These include files subsequently held from training; this is not a count of independent leaves.',
        f'- Admitted **{summary["images"]:,} images**, **{summary["classes"]} crop/condition classes** and **{len(summary["crops"])} crop categories**.',
        f'- Removed **{summary["exact_pixel_duplicates_removed"]} exact decoded-pixel duplicates** from mapped candidates; kept their provenance in the duplicate report.',
        f'- Held/excluded **{summary["quarantine"]:,} image records** for the reasons below. Originals remain available for review.', '',
        '## Shared partitions', '', '| Partition | Images |', '| --- | ---: |',
    ]
    for split in ['train', 'validation', 'test']:
        lines.append(f'| {split} | {summary["splits"][split]:,} |')
    lines += ['', 'Both models must use this exact release, the same image IDs and `class_to_idx.json`. Known PlantVillage test membership takes precedence over nominal split ratios. Related leaf/capture/perceptual groups stay in one partition.', '',
              '## Crop coverage', '', '| Crop category | Images | Classes |', '| --- | ---: | ---: |']
    for crop, images in sorted(crop_rows.items()):
        lines.append(f'| {crop} | {len(images):,} | {len({r["label"] for r in images})} |')
    lines += ['', 'Every retained crop has examples labeled healthy and affected after filtering. This does not establish coverage of every disease for that crop.', '',
              '## Source admission', '', '| Source | Extracted candidates | Admitted images |', '| --- | ---: | ---: |']
    extracted = Counter()
    for row in inventory:
        extracted[row['dataset_id']] += int(row['images'])
    for source in sorted(source_downloads):
        lines.append(f'| {source} | {extracted[source]:,} | {summary["sources"].get(source, 0):,} |')
    lines += ['', '## Exclusions and decisions', '',
        '- MangoLeafBD: held because parent-image lineage for zoomed/rotated derivatives is unresolved.',
        '- Generic citrus source: held to avoid overlapping genus-level and lemon-specific host labels without species metadata.',
        '- Guava scab/healthy-fruit folders and watermelon anthracnose fruit images: excluded from the leaf task. Five deterministic samples per mixed-source class were inspected for organ type; this was not disease-label validation.',
        '- Lemon annotation renderings: excluded; only raw images were admitted.',
        '- Blueberry, raspberry, orange and squash from the selected sources: held where healthy/affected coverage is incomplete.',
        '- Publisher augmentation folders, PlantVillage grayscale/segmented variants, corn/soybean, and out-of-scope pulse/oilseed folders were excluded. Ambiguous labels and inadequate class/group counts were held.',
        '- VegHealth14 was not added because it recompiles other sources with reported duplicates/conflicts. The separate cucumber source overlaps existing coverage and mixes organs; onion needs identifier/metadata resolution; pear needs further symptom/imbalance review. PlantDoc and PlantWild remain candidates for a separate external benchmark.', '',
        '| Quarantine/exclusion reason | Records |', '| --- | ---: |']
    for reason, count in reasons.most_common():
        lines.append(f'| {reason} | {count:,} |')
    lines += ['', '## Integrity and limitations', '',
        '- Preparation fully decoded admitted inputs, applied EXIF-aware RGB conversion for pixel hashing, and recorded byte/pixel hashes. Original image files remain unchanged.',
        '- Rotation/flip-aware pHash (Hamming radius 2), known leaf IDs and available capture-minute groups were used for conservative grouping. Similarity is not proof of shared leaf identity or a label error; unknown relationships can remain.',
        '- Final validation checked all manifest partitions, file/link presence, class coverage and known test boundaries; byte/decode samples were rechecked. Export additionally checked the SHA-256 of every included source image.',
        '- The standalone exporter and loader passed an end-to-end fixture check. Pipeline regression tests cover duplicates, group leakage, conflicting labels, organ/taxonomy exclusions and archive traversal.',
        '- Labels include diseases, pests, deficiencies and symptoms. Their counts are ' + ', '.join(f'{kind}: {count:,}' for kind, count in sorted(conditions.items())) + '. Publisher labels have not been independently verified by an agronomist; a symptom class does not establish a pathogen.',
        '- Internal holdout performance will not establish accuracy on local farmer field photos. The separate external field test is still pending.',
        '- No CNN/ViT accuracy, F1 or inference results have been produced. Model result CSVs remain empty templates.', '',
        '## Training artifacts', '',
        f'- Standalone bundle: `ml/{prepared["bundle_path"]}` ({prepared["bundle_bytes"]:,} bytes). Contains actual image bytes, portable CSV paths, shared class IDs, source metadata and a PIL loader.',
        f'- Bundle SHA-256: `{bundle_hash}`.',
        f'- Local release: `ml/{pointer["relative_path"]}/`.',
        '- Frozen paths and manifest hashes: `ml/configs/prepared_dataset.json`.',
        '- Data and export commands: `ml/data/README.md`. Downloaded images/archives are intentionally ignored by Git.',
        '- Source-specific license terms remain separate; no unified redistribution license is asserted.', '',
    ]
    report = ROOT / 'docs/DATASET_PREPARATION_REPORT.md'
    report.write_text('\n'.join(lines))
    print(f'REPORT {report}; {summary["images"]:,} images / {summary["classes"]} classes / {len(summary["crops"])} crops')


if __name__ == '__main__':
    main()
