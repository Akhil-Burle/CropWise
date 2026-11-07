"""OCR engine behind a tiny interface.

RapidOCR runs the PaddleOCR model family (PP-OCR detection + recognition) on ONNX Runtime. It is used
instead of PaddleOCR itself because PaddlePaddle publishes no wheel for current Python versions, while
ONNX Runtime does; the models ship inside the pip package, so nothing is downloaded and nothing
leaves the machine. To use another engine, implement ``OcrEngine`` and pass it to ``LocalSoilCardReader``.
"""

from __future__ import annotations

import math
import threading
from dataclasses import dataclass
from typing import Protocol

import numpy as np


@dataclass(frozen=True)
class OcrWord:
    """One recognised text box (a table cell or a line), in pixels of the image that was read."""

    text: str
    conf: float
    x0: float
    y0: float
    x1: float
    y1: float
    #: text height (edge length, so it is right for tilted boxes too)
    th: float = 0.0
    #: baseline tilt in degrees; positive = right side lower (clockwise on screen)
    angle: float = 0.0

    @property
    def cx(self) -> float:
        return (self.x0 + self.x1) / 2

    @property
    def cy(self) -> float:
        return (self.y0 + self.y1) / 2

    @property
    def w(self) -> float:
        return self.x1 - self.x0

    @property
    def h(self) -> float:
        return self.y1 - self.y0


class OcrEngine(Protocol):
    name: str

    def recognize(self, rgb: np.ndarray) -> list[OcrWord]:
        """Read all text in an RGB uint8 array (H, W, 3)."""


class RapidOcrEngine:
    name = "rapidocr-pp-ocrv6"

    def __init__(self, min_score: float = 0.3, max_side: int = 2400) -> None:
        from rapidocr import RapidOCR  # imported here so the API still starts without OCR installed

        # min_score is deliberately low: weak reads are kept and flagged for the farmer to check
        # instead of being silently dropped.
        self._ocr = RapidOCR(
            params={
                "Global.log_level": "error",
                "Global.text_score": min_score,
                "Global.max_side_len": max_side,
            }
        )
        self._lock = threading.Lock()  # one inference at a time on the shared sessions

    def recognize(self, rgb: np.ndarray) -> list[OcrWord]:
        with self._lock:
            result = self._ocr(rgb)
        if result is None or result.txts is None or result.boxes is None:
            return []
        words: list[OcrWord] = []
        for box, text, score in zip(result.boxes, result.txts, result.scores):
            text = (text or "").strip()
            if not text:
                continue
            pts = np.asarray(box, dtype=float).reshape(-1, 2)
            if len(pts) < 4:
                continue
            tl, tr, br, bl = pts[0], pts[1], pts[2], pts[3]
            th = (math.dist(tl, bl) + math.dist(tr, br)) / 2
            angle = math.degrees(math.atan2(tr[1] - tl[1], tr[0] - tl[0]))
            words.append(
                OcrWord(
                    text=text,
                    conf=float(score),
                    x0=float(pts[:, 0].min()),
                    y0=float(pts[:, 1].min()),
                    x1=float(pts[:, 0].max()),
                    y1=float(pts[:, 1].max()),
                    th=float(th),
                    angle=float(angle),
                )
            )
        return words
