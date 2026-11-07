"""Model-agnostic interfaces between the API and the ML code.

The API only ever talks to these two protocols. The EfficientNet CNN implements
``LeafClassifier`` today; a Vision Transformer (or anything else) can replace it by
implementing the same two members and being registered in ``registry.py``.
Nothing outside ``ml/`` imports torch.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol, runtime_checkable

from PIL import Image


class MlError(Exception):
    """A model could not produce a result. ``code`` is a frontend AppErrorCode."""

    def __init__(self, code: str, message: str, retryable: bool = False) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.retryable = retryable


@dataclass(frozen=True)
class ModelInfo:
    #: Stable name of the architecture, e.g. "efficientnet_b0".
    model_id: str
    #: Training run / release behind the weights, for traceability of every diagnosis.
    run_id: str
    device: str
    num_classes: int


@runtime_checkable
class LeafClassifier(Protocol):
    info: ModelInfo

    @property
    def labels(self) -> list[str]:
        """Class labels in the form ``<crop>__leaf__<disease>``."""

    def predict(self, image: Image.Image) -> dict[str, float]:
        """Return a probability for every label (sums to 1). Must be thread-safe."""


@dataclass(frozen=True)
class SoilReading:
    key: str  # N | P | K | pH | EC | OC
    value: float | None
    #: 0-1, or None for manual entry.
    confidence: float | None = None
    #: Image-relative box (x, y, w, h as fractions) of the number on the card, if known.
    region: tuple[float, float, float, float] | None = None
    #: Why the farmer should look at this field (see REVIEW_REASONS in soil.py), or None.
    reason: str | None = None


@dataclass(frozen=True)
class SoilCardResult:
    readings: list[SoilReading]
    lab_name: str | None = None
    sample_date: str | None = None  # ISO date
    #: JPEG of the upright page the regions refer to (what the review screen shows).
    view_image: bytes | None = None
    engine: str | None = None
    pages: int = 1


@runtime_checkable
class SoilCardReader(Protocol):
    name: str

    def read(self, data: bytes, mime_type: str) -> SoilCardResult:
        """Extract N, P, K, pH, EC, OC from a soil health card. Raise MlError if unreadable."""
