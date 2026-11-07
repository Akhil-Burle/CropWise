"""Fallback soil card reader, used when the OCR packages are not installed or OCR is turned off.

Cards are still stored and shown; the analysis reports ``UNREADABLE_SOIL_CARD`` and the web app offers
manual entry (``PUT /analysis/{id}/soil``). The real reader is ``ml/soil/`` (local OCR).
"""

from __future__ import annotations

from .base import MlError, SoilCardResult


class UnavailableSoilReader:
    name = "unavailable"

    def __init__(self, reason: str = "") -> None:
        self.reason = reason

    def read(self, data: bytes, mime_type: str) -> SoilCardResult:  # noqa: ARG002
        raise MlError("UNREADABLE_SOIL_CARD", "Soil card reading is not available; please type the values", retryable=False)
