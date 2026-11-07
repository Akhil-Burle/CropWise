"""Fetch public dataset metadata and explicitly selected files; no publisher code is run."""
from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import time

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

ML = Path(__file__).resolve().parents[2]
RAW = ML / 'data/raw'
SOURCES = {
    'krishna_chilli_v3': ('ymt8k9bjkn', 3),
    'vegetables_bd_v3': ('n67gctmjyj', 3),
    'gourds_okra_v2': ('2svdj3yyrk', 2),
    'vegetables_seven_v1': ('hgshn2zg3t', 1),
    'mango_leaf_bd_v1': ('hxsnvwty3r', 1),
    'banana_lsd_v1': ('9tb7k297ff', 1),
    'papaya_leaf_v2': ('p997fvf526', 2),
    'guava_v1': ('77vyz8d9v3', 1),
    'citrus_v2': ('3f83gxmv57', 2),
    'lemon_v6': ('643f5bbc2t', 6),
    'watermelon_v1': ('ntzym554jp', 1),
    'malabar_spinach': ('sy69db2nz5', 2),
}
PLANTVILLAGE_REVISION = '9e97599868962bd0079b8db4b7f1efa9185fa1e7'


def session():
    s = requests.Session()
    s.headers['User-Agent'] = 'CropWise-academic-dataset-preparation/1.0'
    retry = Retry(total=4, backoff_factor=1, status_forcelist=[429, 500, 502, 503, 504])
    s.mount('https://', HTTPAdapter(max_retries=retry))
    return s


def get_json(s, url, **kwargs):
    r = s.get(url, timeout=60, **kwargs)
    r.raise_for_status()
    return r.json()


def dump(path, obj):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, indent=2) + '\n')


def discover_one(item):
    name, (dataset, version) = item
    s = session()
    base = f'https://data.mendeley.com/public-api/datasets/{dataset}'
    snapshot = get_json(s, f'{base}/snapshot/{version}')
    folders = get_json(s, f'{base}/folders/{version}')
    files = []
    for folder in ['root'] + [f['id'] for f in folders]:
        start = 0
        while True:
            batch = get_json(s, f'{base}/files', params={
                'folder_id': folder, 'version': version, '$start': start, '$limit': 1000,
            }, headers={'Accept': 'application/vnd.mendeley-public-dataset.1+json'})
            files.extend(batch)
            if len(batch) < 1000:
                break
            start += 1000
    out = RAW / name / 'metadata'
    dump(out / 'snapshot.json', snapshot)
    dump(out / 'folders.json', folders)
    dump(out / 'files.json', files)
    archives = [f for f in files if f['filename'].lower().endswith(('.zip', '.rar', '.7z'))]
    print(name, f'{len(files)} files;', json.dumps([{'name': f['filename'], 'id': f['id'],
                            'bytes': f['content_details']['size']} for f in archives]), flush=True)
    return name


def discover():
    RAW.mkdir(parents=True, exist_ok=True)
    with ThreadPoolExecutor(max_workers=3) as pool:
        futures = {name: pool.submit(discover_one, (name, value)) for name, value in SOURCES.items()}
        for name, future in futures.items():
            try:
                future.result()
            except Exception as e:
                print(f'DISCOVERY_ERROR {name}: {e}', flush=True)
    s = session()
    # Pin the exact PlantVillage snapshot used by the prepared release; never follow main.
    repo = get_json(s, f'https://huggingface.co/api/datasets/mohanty/PlantVillage/revision/{PLANTVILLAGE_REVISION}')
    revision = repo['sha']
    if revision != PLANTVILLAGE_REVISION:
        raise ValueError(f'PlantVillage revision mismatch: expected {PLANTVILLAGE_REVISION}, got {revision}')
    listing = get_json(s, f'https://huggingface.co/api/datasets/mohanty/PlantVillage/tree/{revision}')
    dump(RAW / 'plantvillage/metadata/repository.json', repo)
    dump(RAW / 'plantvillage/metadata/files.json', listing)
    print('plantvillage', revision, flush=True)


def sha256(path):
    h = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()


def fetch_ranges(url, partial, size):
    """Download disjoint 8 MiB ranges, preserving completed chunks across interruptions."""
    chunk_size = 8 * 1024 * 1024
    with session().get(url, headers={'Range': 'bytes=0-0'}, stream=True, timeout=(30, 60)) as probe:
        probe.raise_for_status()
        if probe.status_code != 206 or not probe.headers.get('Content-Range', '').endswith(f'/{size}'):
            return False
        # Revisit the public entry URL per chunk so short-lived publisher signatures refresh.
        resolved_url = url
    parts_dir = partial.with_name(partial.name + '.chunks')
    parts_dir.mkdir(exist_ok=True)
    count = (size + chunk_size - 1) // chunk_size
    # Preserve existing contiguous progress from the original streaming downloader.
    if partial.exists():
        with partial.open('rb') as stream:
            for index in range(count):
                expected = min(chunk_size, size - index * chunk_size)
                data = stream.read(expected)
                if len(data) != expected:
                    break
                target = parts_dir / f'{index:06d}'
                if not target.exists():
                    target.write_bytes(data)
    def chunk(index):
        start, end = index * chunk_size, min(size, (index + 1) * chunk_size) - 1
        target = parts_dir / f'{index:06d}'
        expected = end - start + 1
        if target.exists() and target.stat().st_size == expected:
            return
        temp = target.with_suffix('.tmp')
        for attempt in range(12):
            try:
                offset = temp.stat().st_size if temp.exists() else 0
                if offset == expected:
                    temp.rename(target)
                    return
                request_start = start + offset
                if offset > expected:
                    raise ValueError('Oversized partial chunk')
                with session().get(resolved_url, headers={'Range': f'bytes={request_start}-{end}'},
                                   stream=True, timeout=(30, 90)) as response:
                    response.raise_for_status()
                    if response.status_code != 206 or response.headers.get('Content-Range') != f'bytes {request_start}-{end}/{size}':
                        raise ValueError('Server did not honor requested range')
                    started = time.monotonic()
                    received = 0
                    with temp.open('ab' if offset else 'wb') as stream:
                        for block in response.iter_content(64 * 1024):
                            stream.write(block)
                            received += len(block)
                            elapsed = time.monotonic() - started
                            if elapsed > 30 and received / elapsed < 80_000:
                                raise requests.Timeout('Slow connection; reconnecting with partial chunk preserved')
                    if temp.stat().st_size != expected:
                        raise ValueError('Incomplete range')
                    temp.rename(target)
                    return
            except (requests.RequestException, OSError, ValueError):
                if attempt == 11:
                    raise
                time.sleep(min(8, 2 ** attempt))
    print(f'RANGED_DOWNLOAD {partial.name} ({count} chunks)', flush=True)
    completed, last = 0, time.monotonic()
    with ThreadPoolExecutor(max_workers=16) as pool:
        from concurrent.futures import as_completed
        for future in as_completed([pool.submit(chunk, i) for i in range(count)]):
            future.result()
            completed += 1
            if time.monotonic() - last > 20:
                print(f'PROGRESS {partial.name}: {completed}/{count} chunks', flush=True)
                last = time.monotonic()
    with partial.open('wb') as stream:
        for index in range(count):
            with (parts_dir / f'{index:06d}').open('rb') as incoming:
                while block := incoming.read(1024 * 1024):
                    stream.write(block)
    return True


def fetch_file(source, file_name, url, expected_hash=None, expected_bytes=None):
    out = RAW / source / 'downloads' / Path(file_name).name
    out.parent.mkdir(parents=True, exist_ok=True)
    if out.exists() and (not expected_bytes or out.stat().st_size == expected_bytes):
        digest = sha256(out)
        if expected_hash and digest != expected_hash:
            raise ValueError(f'Existing file checksum mismatch: {out}')
        print(f'VERIFIED {source}/{file_name}', flush=True)
        return
    partial = out.with_name(out.name + '.part')
    if expected_bytes and expected_bytes > 16 * 1024 * 1024:
        if fetch_ranges(url, partial, expected_bytes):
            digest = sha256(partial)
            if expected_hash and digest != expected_hash:
                raise ValueError(f'Checksum mismatch: {partial}')
            partial.rename(out)
            dump(out.with_name(out.name + '.receipt.json'), {
                'source': source, 'url': url, 'sha256': digest, 'bytes': out.stat().st_size,
                'downloaded_at': datetime.now(timezone.utc).isoformat(),
                'publisher_hash_verified': bool(expected_hash),
            })
            print(f'COMPLETE {source}/{file_name}', flush=True)
            return
    # Retry interrupted streams; HTTP Range resumes only after verifying the server response.
    for attempt in range(5):
        try:
            offset = partial.stat().st_size if partial.exists() else 0
            with session().get(url, stream=True, timeout=(30, 120),
                               headers={'Range': f'bytes={offset}-'} if offset else {}) as response:
                response.raise_for_status()
                append = offset and response.status_code == 206
                if append and not response.headers.get('Content-Range', '').startswith(f'bytes {offset}-'):
                    raise ValueError('Invalid resume response')
                print(f'DOWNLOAD {source}/{file_name} offset={offset if append else 0}', flush=True)
                last = time.monotonic()
                with partial.open('ab' if append else 'wb') as stream:
                    for block in response.iter_content(1024 * 1024):
                        stream.write(block)
                        if time.monotonic() - last > 20:
                            print(f'PROGRESS {source}/{file_name}: {stream.tell() / 1e6:.0f} MB', flush=True)
                            last = time.monotonic()
            if expected_bytes and partial.stat().st_size != expected_bytes:
                raise ValueError('Downloaded size mismatch')
            digest = sha256(partial)
            if expected_hash and digest != expected_hash:
                raise ValueError(f'Checksum mismatch: {partial}')
            partial.rename(out)
            dump(out.with_name(out.name + '.receipt.json'), {
                'source': source, 'url': url, 'sha256': digest, 'bytes': out.stat().st_size,
                'downloaded_at': datetime.now(timezone.utc).isoformat(),
                'publisher_hash_verified': bool(expected_hash),
            })
            print(f'COMPLETE {source}/{file_name}', flush=True)
            return
        except (requests.RequestException, OSError) as e:
            if attempt == 4:
                raise
            print(f'RETRY {source}: {e}', flush=True)
            time.sleep(2 ** attempt)


def download(plan):
    entries = json.loads(Path(plan).read_text())['files']
    def run(entry):
        source, file_id = entry['source'], entry['file_id']
        if file_id == '__all__':
            dataset, version = SOURCES[source]
            cache_path = RAW / source / 'metadata/archive.json'
            if cache_path.exists():
                metadata = json.loads(cache_path.read_text())
            else:
                metadata = get_json(session(), f'https://data.mendeley.com/api/datasets-v2/datasets/{dataset}/zip?version={version}')
                dump(cache_path, metadata)
            if metadata.get('status') != 'FINISH':
                raise ValueError(f'Publisher archive not ready: {source}')
            fetch_file(source, f'{dataset}-{version}.zip',
                       f'https://data.mendeley.com/public-api/zip/{dataset}/download/{version}',
                       metadata.get('sha256_hash'), metadata['size'])
        elif source == 'plantvillage':
            repo = json.loads((RAW / source / 'metadata/repository.json').read_text())
            revision = repo['sha']
            base = f'https://huggingface.co/datasets/mohanty/PlantVillage/resolve/{revision}/'
            listing = json.loads((RAW / source / 'metadata/files.json').read_text())
            item = next((f for f in listing if f['path'] == file_id), {})
            fetch_file(source, file_id.replace('/', '__'), base + file_id,
                       item.get('lfs', {}).get('oid'), item.get('size'))
        else:
            files = json.loads((RAW / source / 'metadata/files.json').read_text())
            item = next(f for f in files if f['id'] == file_id)
            details = item['content_details']
            fetch_file(source, item['filename'], details['download_url'],
                       details.get('sha256_hash'), details['size'])
    failures = []
    with ThreadPoolExecutor(max_workers=3) as pool:
        futures = [(entry, pool.submit(run, entry)) for entry in entries]
        for entry, future in futures:
            try:
                future.result()
            except Exception as e:
                failures.append({'entry': entry, 'error': str(e)})
                print('DOWNLOAD_ERROR', entry, str(e), flush=True)
    dump(RAW / 'download_failures.json', failures)
    if failures:
        raise SystemExit(1)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--discover', action='store_true')
    parser.add_argument('--plan')
    args = parser.parse_args()
    if args.discover:
        discover()
    elif args.plan:
        download(args.plan)
    else:
        parser.error('Choose --discover or --plan FILE')
