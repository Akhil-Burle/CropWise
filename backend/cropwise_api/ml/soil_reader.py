"""Soil Health Card reader. The OCR (ml/src/ocr) is not implemented yet.

Until it is, uploaded cards are stored and the analysis reports ``UNREADABLE_SOIL_CARD``; the web
app then offers manual entry (``PUT /analysis/{id}/soil``). When OCR exists, implement
``SoilCardReader`` and return it from ``registry.build_soil_reader``.
"""

from __future__ import annotations

from .base import MlError, SoilCardResult


class UnavailableSoilReader:
    name = "unavailable"

    def read(self, data: bytes, mime_type: str) -> SoilCardResult:  # noqa: ARG002
        raise MlError("UNREADABLE_SOIL_CARD", "Soil card reading is not available yet", retryable=False)
