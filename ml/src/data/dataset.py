"""Framework-independent PIL dataset; usable with a PyTorch DataLoader once torch is installed."""
import csv
import json
from pathlib import Path

from PIL import Image, ImageOps


class CropWiseDataset:
    def __init__(self, manifest, transform=None, ml_root=None):
        self.manifest = Path(manifest)
        with self.manifest.open(newline='') as stream:
            self.rows = list(csv.DictReader(stream))
        if ml_root is not None:
            self.root = Path(ml_root)
        elif self.rows and self.rows[0]['relative_path'].startswith('imagefolder/'):
            self.root = self.manifest.parent  # Standalone export, independent of project location.
        else:
            self.root = Path(__file__).resolve().parents[2]
        self.class_to_idx = json.loads((self.manifest.parent / 'class_to_idx.json').read_text())
        self.transform = transform

    def __len__(self):
        return len(self.rows)

    def __getitem__(self, index):
        row = self.rows[index]
        with Image.open(self.root / row['relative_path']) as image:
            image = ImageOps.exif_transpose(image).convert('RGB')
        if self.transform:
            image = self.transform(image)
        return image, self.class_to_idx[row['label']]
