"""Soil report reader: photo / scan / PDF in, N-P-K-pH-EC-OC values (with honesty about doubt) out."""

from __future__ import annotations

import importlib.util
import logging
import threading
from dataclasses import dataclass

from PIL import Image

from ...config import Settings
from ..base import MlError, SoilCardResult, SoilReading
from .documents import Page, load_pages
from .engine import OcrEngine, OcrWord, RapidOcrEngine
from .imaging import deskew, median_skew, ocr_array, rotate_quarter, to_jpeg
from .lexicon import KEYS
from .parser import ParsedReading, ParsedReport, parse

log = logging.getLogger("cropwise.soil")

#: pad highlight boxes a little so the number is not cut off
_PAD = 0.004


@dataclass
class _Attempt:
    image: Image.Image  # the upright image the words refer to (possibly rotated / straightened)
    words: list[OcrWord]
    parsed: ParsedReport
    size: tuple[int, int]  # pixel size of the array that was read (same aspect as `image`)
    score: float
    geometry_changed: bool = False


def _score(words: list[OcrWord], parsed: ParsedReport) -> float:
    readable = sum(w.conf * min(len(w.text), 20) for w in words if w.conf >= 0.6) / 10
    return parsed.labels_found * 1000 + parsed.values_found * 100 + readable


class LocalSoilCardReader:
    """Reads soil reports with a local OCR engine. Nothing leaves the machine."""

    name = RapidOcrEngine.name

    def __init__(self, settings: Settings, engine: OcrEngine | None = None) -> None:
        if engine is None:
            missing = [m for m in ("rapidocr", "onnxruntime", "cv2") if importlib.util.find_spec(m) is None]
            if missing:
                raise ImportError(f"OCR dependencies missing: {', '.join(missing)}")
        self._settings = settings
        self._engine = engine
        self._lock = threading.Lock()
        if engine is not None:
            self.name = engine.name

    # ------------------------------------------------------------------ public

    def warm_up(self) -> None:
        self._get_engine()

    def read(self, data: bytes, mime: str) -> SoilCardResult:
        pages = load_pages(data, mime, self._settings.ocr_max_pages)
        attempts = [self._read_page(page) for page in pages]

        order = sorted(range(len(attempts)), key=lambda i: (attempts[i].parsed.values_found, attempts[i].parsed.labels_found), reverse=True)
        best_index = order[0]
        best = attempts[best_index]
        if not best.words:
            raise MlError("UNREADABLE_SOIL_CARD", "No text could be read. Try a brighter, sharper photo of the whole card.")
        if not any(a.parsed.soil_like for a in attempts):
            raise MlError(
                "UNREADABLE_SOIL_CARD",
                "No soil test values were found. Check that this is the soil test report, or type the values in.",
            )

        readings: dict[str, SoilReading] = {}
        for index in [best_index, *[i for i in order if i != best_index]]:
            a = attempts[index]
            w, h = a.size
            for key in KEYS:
                parsed = a.parsed.readings.get(key)
                if parsed is None:
                    continue
                current = readings.get(key)
                if current is not None and (current.value is not None or parsed.value is None):
                    continue
                region = None
                if index == best_index and parsed.box:
                    x0, y0, x1, y1 = parsed.box
                    region = (
                        round(max(0.0, x0 / w - _PAD), 4),
                        round(max(0.0, y0 / h - _PAD), 4),
                        round(min(1.0, (x1 - x0) / w + 2 * _PAD), 4),
                        round(min(1.0, (y1 - y0) / h + 2 * _PAD), 4),
                    )
                readings[key] = SoilReading(key, parsed.value, round(parsed.conf, 3), region, parsed.reason)

        lab = next((a.parsed.lab_name for a in [best, *attempts] if a.parsed.lab_name), None)
        sample_date = next((a.parsed.sample_date for a in [best, *attempts] if a.parsed.sample_date), None)
        log.info(
            "soil report read: %d/%d values, %d page(s), engine=%s",
            sum(1 for r in readings.values() if r.value is not None),
            len(KEYS),
            len(pages),
            self.name,
        )
        return SoilCardResult(
            readings=[readings[k] for k in KEYS if k in readings],
            lab_name=lab,
            sample_date=sample_date,
            view_image=to_jpeg(best.image),
            engine=self.name,
            pages=len(pages),
        )

    # ------------------------------------------------------------------ internals

    def _get_engine(self) -> OcrEngine:
        with self._lock:
            if self._engine is None:
                try:
                    self._engine = RapidOcrEngine()
                except Exception as exc:
                    raise MlError("UNREADABLE_SOIL_CARD", f"The OCR engine could not start ({type(exc).__name__})", retryable=True) from exc
                self.name = self._engine.name
            return self._engine

    def _run(self, image: Image.Image, geometry_changed: bool = False) -> _Attempt:
        engine = self._get_engine()
        array = ocr_array(image)
        words = engine.recognize(array)
        height, width = array.shape[:2]
        parsed = parse(words, width, height, self._settings.ocr_fill_min_confidence)
        return _Attempt(image, words, parsed, (width, height), _score(words, parsed), geometry_changed)

    def _read_page(self, page: Page) -> _Attempt:
        text_attempt: _Attempt | None = None
        if page.cells:  # digital PDF: the text is exact, no OCR needed when it is complete
            width, height = page.image.size
            parsed = parse(page.cells, width, height, self._settings.ocr_fill_min_confidence)
            text_attempt = _Attempt(page.image, page.cells, parsed, (width, height), _score(page.cells, parsed))
            if parsed.values_found >= 5 and all(r.reason in (None, "unit_converted", "unit_assumed") for r in parsed.readings.values() if r.value is not None):
                return text_attempt

        best = self._straighten(self._run(page.image))  # photographed at an angle: level it first
        if self._looks_wrong(best):  # sideways / upside-down card: try the other orientations
            tall = self._tall_ratio(best)
            for degrees in (90, 270, 180) if tall > 0.3 else (180, 90, 270):
                candidate = self._run(rotate_quarter(best.image, degrees), geometry_changed=True)
                if candidate.score > best.score:
                    best = candidate
                if best.parsed.values_found >= 3 and best.parsed.values_found >= best.parsed.labels_found:
                    break
            best = self._straighten(best)

        if text_attempt is not None:
            best = self._merge_text_layer(best, text_attempt)
        return best

    @staticmethod
    def _tall_ratio(attempt: _Attempt) -> float:
        long_words = [w for w in attempt.words if len(w.text) >= 4]
        return sum(1 for w in long_words if w.h > 1.3 * w.w) / max(len(long_words), 1)

    def _looks_wrong(self, attempt: _Attempt) -> bool:
        return (
            attempt.parsed.labels_found == 0
            or attempt.parsed.values_found < attempt.parsed.labels_found  # names found, values not: rows are off
            or self._tall_ratio(attempt) > 0.3  # text runs vertically
        )

    def _straighten(self, attempt: _Attempt) -> _Attempt:
        angle = median_skew([(w.angle, w.w) for w in attempt.words if w.w > 3 * max(w.th, 1.0)])
        if not 2.5 <= abs(angle) <= 30:
            return attempt
        straight = self._run(deskew(attempt.image, angle), geometry_changed=True)
        return straight if straight.score >= attempt.score else attempt

    @staticmethod
    def _merge_text_layer(ocr: _Attempt, text: _Attempt) -> _Attempt:
        """Fill what OCR missed with exact text-layer values (same page, so regions only if unrotated)."""
        merged = dict(ocr.parsed.readings)
        for key, reading in text.parsed.readings.items():
            current = merged.get(key)
            if reading.value is not None and (current is None or current.value is None or reading.conf > current.conf):
                merged[key] = (
                    ParsedReading(reading.key, reading.value, reading.conf, None, reading.reason)
                    if ocr.geometry_changed
                    else reading
                )
        ocr.parsed.readings = merged
        ocr.parsed.values_found = sum(1 for r in merged.values() if r.value is not None)
        ocr.parsed.lab_name = ocr.parsed.lab_name or text.parsed.lab_name
        ocr.parsed.sample_date = ocr.parsed.sample_date or text.parsed.sample_date
        return ocr
