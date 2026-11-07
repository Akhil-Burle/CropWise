"""Classify leaf images with a trained CropWise checkpoint."""
# use: python3 ml/src/models/cnn/predict.py "ml/data/raw/guava_v1/images/8f6769ee9de6/Resize_Data/Guava Powdery Mildew/image_0001.png"

import argparse
from pathlib import Path

import torch
from PIL import Image
from torch import nn
from torchvision import models, transforms

parser = argparse.ArgumentParser()
parser.add_argument("images", nargs="+", type=Path, help="image files or folders")
parser.add_argument("--checkpoint", type=Path,
                    default=Path("/home/akhil/cropwise/ml/checkpoints/cnn/d053c9012200c857/best.pt"))
parser.add_argument("--image-size", type=int, default=224)
parser.add_argument("--topk", type=int, default=3)
parser.add_argument("--device", default="cpu")  # cpu is fine for a few images
args = parser.parse_args()

ckpt = torch.load(args.checkpoint, map_location="cpu", weights_only=True)
class_to_idx = ckpt["class_to_idx"]
idx_to_class = {v: k for k, v in class_to_idx.items()}

model = models.efficientnet_b0(weights=None)
model.classifier[1] = nn.Linear(model.classifier[1].in_features, len(class_to_idx))
model.load_state_dict(ckpt["state_dict"])
model.to(args.device).eval()
print(f"Loaded epoch {ckpt['epoch']} (val macro F1 {ckpt['validation_macro_f1']:.4f}), "
      f"{len(class_to_idx)} classes\n")

tf = transforms.Compose([
    transforms.Resize(args.image_size + 32), transforms.CenterCrop(args.image_size),
    transforms.ToTensor(),
    transforms.Normalize(mean=(0.485, 0.456, 0.406), std=(0.229, 0.224, 0.225)),
])

files = []
for p in args.images:
    files += sorted(f for f in p.rglob("*") if f.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"}) \
        if p.is_dir() else [p]

with torch.inference_mode():
    for f in files:
        x = tf(Image.open(f).convert("RGB")).unsqueeze(0).to(args.device)
        probs = torch.softmax(model(x), dim=1)[0]
        top = probs.topk(args.topk)
        print(f.name)
        for p, i in zip(top.values.tolist(), top.indices.tolist()):
            print(f"   {p*100:5.1f}%  {idx_to_class[i]}")
        if top.values[0] < 0.70:
            print("   -> low confidence, would tell the user to consult an expert")