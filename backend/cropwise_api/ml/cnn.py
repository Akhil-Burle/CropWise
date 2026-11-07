"""EfficientNet-B0 leaf classifier (checkpoints written by ml/src/models/cnn/train.py)."""

from __future__ import annotations

import threading
from pathlib import Path

from PIL import Image, ImageOps

from .base import MlError, ModelInfo

#: Run used when no checkpoint is configured (same default as ml/src/models/cnn/predict.py).
DEFAULT_RUN_ID = "d053c9012200c857"
IMAGE_SIZE = 224


def default_checkpoint(repo_root: Path) -> Path:
    return repo_root / "ml" / "checkpoints" / "cnn" / DEFAULT_RUN_ID / "best.pt"


def pick_device(requested: str) -> str:
    import torch

    if requested != "auto":
        return requested
    if torch.cuda.is_available():
        return "cuda"
    if hasattr(torch, "xpu") and torch.xpu.is_available():
        return "xpu"
    return "cpu"


class CnnLeafClassifier:
    def __init__(self, checkpoint: Path, device: str = "cpu") -> None:
        import torch
        from torch import nn
        from torchvision import models, transforms

        if not checkpoint.is_file():
            raise MlError("SERVER", f"CNN checkpoint not found: {checkpoint}")

        self._torch = torch
        self._device = pick_device(device)
        ckpt = torch.load(checkpoint, map_location="cpu", weights_only=True)
        class_to_idx: dict[str, int] = ckpt["class_to_idx"]
        self._labels = [label for label, _ in sorted(class_to_idx.items(), key=lambda kv: kv[1])]

        model = models.efficientnet_b0(weights=None)
        model.classifier[1] = nn.Linear(model.classifier[1].in_features, len(self._labels))
        model.load_state_dict(ckpt["state_dict"])
        self._model = model.to(self._device).eval()

        # Identical to ml/src/models/cnn/predict.py so serving matches evaluation.
        self._transform = transforms.Compose(
            [
                transforms.Resize(IMAGE_SIZE + 32),
                transforms.CenterCrop(IMAGE_SIZE),
                transforms.ToTensor(),
                transforms.Normalize(mean=(0.485, 0.456, 0.406), std=(0.229, 0.224, 0.225)),
            ]
        )
        self._lock = threading.Lock()
        self.info = ModelInfo(
            model_id="efficientnet_b0",
            run_id=checkpoint.parent.name,
            device=self._device,
            num_classes=len(self._labels),
        )

    @property
    def labels(self) -> list[str]:
        return self._labels

    def predict(self, image: Image.Image) -> dict[str, float]:
        torch = self._torch
        rgb = ImageOps.exif_transpose(image).convert("RGB")
        batch = self._transform(rgb).unsqueeze(0).to(self._device)
        with self._lock, torch.inference_mode():
            probs = torch.softmax(self._model(batch), dim=1)[0].cpu().tolist()
        return dict(zip(self._labels, probs))
