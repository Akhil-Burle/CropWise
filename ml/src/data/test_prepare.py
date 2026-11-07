"""Tests target split leakage and conflicting labels, not agronomic accuracy."""
import copy
import random
import unittest

from prepare import BKTree, assign_splits


def fixtures():
    rng = random.Random(123)
    return [{'image_id': f'{label}-{i}', 'label': label, 'sha256': f'sha-{label}-{i}',
             'pixel_sha256': f'pixel-{label}-{i}', 'phash': f'{rng.getrandbits(64):016x}',
             'capture_group': '', 'dataset_id': 'fixture', 'official_split': ''}
            for label in ['tomato__leaf__healthy', 'tomato__leaf__early_blight'] for i in range(60)]


class PreparationTests(unittest.TestCase):
    def test_exact_duplicate_removed_and_test_group_preserved(self):
        rows = fixtures()
        duplicate = {**rows[0], 'image_id': 'another-source-copy', 'official_split': 'test'}
        rows.append(duplicate)
        final, quarantine, duplicates, _ = assign_splits(rows)
        self.assertEqual(len(duplicates), 1)
        self.assertFalse(quarantine)
        kept = next(r for r in final if r['pixel_sha256'] == duplicate['pixel_sha256'])
        self.assertEqual(kept['split'], 'test')

    def test_conflicting_duplicate_labels_quarantined(self):
        rows = fixtures()
        rows.append({**rows[0], 'image_id': 'bad-label', 'label': 'tomato__leaf__early_blight'})
        _, quarantine, _, _ = assign_splits(rows)
        self.assertEqual({r['image_id'] for r in quarantine}, {rows[0]['image_id'], 'bad-label'})

    def test_near_duplicates_same_split_and_reproducible(self):
        rows = fixtures()
        near = {**rows[0], 'image_id': 'near-copy', 'sha256': 'other-bytes',
                'pixel_sha256': 'other-pixels', 'phash': f'{int(rows[0]["phash"],16) ^ 1:016x}'}
        rows.append(near)
        first = assign_splits(copy.deepcopy(rows))[0]
        second = assign_splits(copy.deepcopy(rows))[0]
        a = {r['image_id']: r['split'] for r in first}
        self.assertEqual(a, {r['image_id']: r['split'] for r in second})
        self.assertEqual(a[rows[0]['image_id']], a['near-copy'])
        for label in {r['label'] for r in first}:
            self.assertEqual({r['split'] for r in first if r['label'] == label}, {'train','validation','test'})

    def test_known_leaf_group_stays_together(self):
        rows = fixtures()
        rows[0]['capture_group'] = rows[1]['capture_group'] = 'same-leaf'
        final = assign_splits(rows)[0]
        partitions = {r['image_id']: r['split'] for r in final}
        self.assertEqual(partitions[rows[0]['image_id']], partitions[rows[1]['image_id']])

    def test_bktree_finds_expected_neighbors(self):
        tree = BKTree()
        for value in [0, 1, 3, 255]:
            tree.add(value, value)
        self.assertEqual({i for _,i in tree.query(0, 1)}, {0,1})


if __name__ == '__main__':
    unittest.main()
