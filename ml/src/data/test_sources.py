import tempfile
from pathlib import Path
import unittest
import zipfile
import csv
import json
from PIL import Image

from extract import extract_one
from map_folders import infer
from dataset import CropWiseDataset


class SourceAdmissionTests(unittest.TestCase):
    def test_lemon_annotation_renderings_are_excluded(self):
        self.assertIn('excluded', infer('lemon_v6', 'hash/Annotated Image/Disease/Anthracnose')[3])
        self.assertEqual(infer('lemon_v6', 'hash/Raw Image/Disease/Anthracnose')[:3],
                         ('lemon', 'anthracnose', 'disease'))

    def test_guava_fruit_is_not_relabeled_as_leaf(self):
        self.assertEqual(infer('guava_v1', 'hash/Resize_Data/Guava Scave Disease')[0], '')
        self.assertEqual(infer('guava_v1', 'hash/Resize_Data/Healthy Fruits')[0], '')
        self.assertEqual(infer('guava_v1', 'hash/Resize_Data/Healthy Leaf')[:3],
                         ('guava', 'healthy', 'healthy'))

    def test_ambiguous_viral_label_is_not_guessed(self):
        result = infer('vegetables_seven_v1',
                       'hash/dataset/Bitter gourd(303)/Leaf curl (Mosaic virus)(132)')
        self.assertEqual(result[1], '')

    def test_unspecified_citrus_is_not_a_competing_lemon_class(self):
        result = infer('citrus_v2', 'hash/Citrus/Leaves/healthy')
        self.assertEqual(result[0], '')
        self.assertIn('taxonomy_review', result[3])

    def test_watermelon_fruit_anthracnose_excluded_from_leaf_task(self):
        self.assertEqual(infer('watermelon_v1', 'hash/Watermelon/Anthracnose')[0], '')
        self.assertEqual(infer('watermelon_v1', 'hash/Watermelon/Downy_Mildew')[:3],
                         ('watermelon', 'downy_mildew', 'disease'))

    def test_archive_path_traversal_refused(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            archive = root / 'bad.zip'
            with zipfile.ZipFile(archive, 'w') as stream:
                stream.writestr('../outside.jpg', b'not an image')
            with self.assertRaises(ValueError):
                extract_one('fixture', archive, root / 'out')
            self.assertFalse((root / 'outside.jpg').exists())

    def test_standalone_loader_resolves_bundle_relative_paths(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            image = root / 'imagefolder/train/crop__leaf__healthy/example.png'
            image.parent.mkdir(parents=True)
            Image.new('RGBA', (64,64), (0,128,0,255)).save(image)
            (root / 'class_to_idx.json').write_text(json.dumps({'crop__leaf__healthy': 0}))
            with (root / 'train.csv').open('w', newline='') as stream:
                writer = csv.DictWriter(stream, fieldnames=['relative_path','label'])
                writer.writeheader()
                writer.writerow({'relative_path': image.relative_to(root).as_posix(),
                                 'label': 'crop__leaf__healthy'})
            dataset = CropWiseDataset(root / 'train.csv')
            loaded, label = dataset[0]
            self.assertEqual(loaded.mode, 'RGB')
            self.assertEqual(label, 0)
            self.assertEqual(dataset.root, root)


if __name__ == '__main__':
    unittest.main()
