"""Chooses which model serves requests. Add a ViT here when it exists; nothing else changes."""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Callable

from ..config import REPO_ROOT, Settings
from .base import LeafClassifier, MlError, SoilCardReader
from .soil_reader import UnavailableSoilReader

log = logging.getLogger("cropwise.ml")


def _build_cnn(settings: Settings) -> LeafClassifier:
    from .cnn import CnnLeafClassifier, default_checkpoint

    checkpoint = Path(settings.leaf_checkpoint) if settings.leaf_checkpoint else default_checkpoint(REPO_ROOT)
    return CnnLeafClassifier(checkpoint, settings.device)


def _build_vit(settings: Settings) -> LeafClassifier:
    # Implement ml/vit.py with the LeafClassifier protocol (labels + predict) and import it here.
    raise MlError("NOT_IMPLEMENTED", "The ViT leaf model is not available yet")


LEAF_MODELS: dict[str, Callable[[Settings], LeafClassifier]] = {
    "cnn": _build_cnn,
    "vit": _build_vit,
}


def build_leaf_classifier(settings: Settings) -> LeafClassifier:
    try:
        factory = LEAF_MODELS[settings.leaf_model]
    except KeyError:
        raise MlError("SERVER", f"Unknown leaf model '{settings.leaf_model}'. Choose one of: {', '.join(LEAF_MODELS)}")
    return factory(settings)


def build_soil_reader(settings: Settings) -> SoilCardReader:
    """Local OCR when its packages are installed; otherwise cards are stored and values typed by hand."""
    if settings.soil_reader == "unavailable":
        return UnavailableSoilReader("turned off with CROPWISE_SOIL_READER=unavailable")
    if settings.soil_reader != "rapidocr":
        raise MlError("SERVER", f"Unknown soil reader '{settings.soil_reader}'. Choose rapidocr or unavailable")
    try:
        from .soil import LocalSoilCardReader

        return LocalSoilCardReader(settings)
    except ImportError as exc:
        log.warning("Soil card OCR not available: %s", exc)
        return UnavailableSoilReader(str(exc))
