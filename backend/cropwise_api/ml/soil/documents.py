"""Turns an uploaded soil report (photo, scan or PDF) into upright RGB pages.

Supported: JPEG (incl. MPO from Android cameras), PNG, WEBP, HEIC/HEIF (iPhone), TIFF (scanners,
multi-page) and PDF (digital with a text layer, or scanned). Camera photos are rotated upright from
their EXIF orientation here; sideways or upside-down cards are fixed later by the reader.
"""

from __future__ import annotations

import io
import threading
from dataclasses import dataclass

import numpy as np
from PIL import Image, ImageOps, ImageSequence

from ..base import MlError
from .engine import OcrWord
from .imaging import MAX_SIDE, limit_side

try:
    import pillow_heif

    pillow_heif.register_heif_opener()
except ImportError:  # pragma: no cover - optional dependency
    pillow_heif = None

#: PDFium is not thread-safe: every use goes through this lock.
_PDFIUM_LOCK = threading.Lock()
#: longest side, in pixels, that a PDF page is rendered to
PDF_RENDER_SIDE = 2200


@dataclass
class Page:
    image: Image.Image  # RGB, upright, at most MAX_SIDE px
    #: text cells from a digital PDF's own text layer (pixel coordinates of `image`), else None
    cells: list[OcrWord] | None = None


def load_pages(data: bytes, mime: str, max_pages: int = 4) -> list[Page]:
    """Decode a report into pages. Raises MlError('UNREADABLE_SOIL_CARD', ...) for unusable files."""
    if data[:5] == b"%PDF-" or mime == "application/pdf":
        return _load_pdf(data, max_pages)
    return _load_image(data, max_pages)


# ----------------------------------------------------------------------------- images


def _to_rgb(img: Image.Image) -> Image.Image:
    if img.mode in ("I;16", "I;16B", "I;16L", "I", "F"):
        arr = np.asarray(img, dtype=np.float64)
        top = arr.max() or 1.0
        return Image.fromarray((arr / top * 255).astype(np.uint8)).convert("RGB")
    if img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info):
        rgba = img.convert("RGBA")
        flat = Image.new("RGB", rgba.size, (255, 255, 255))
        flat.paste(rgba, mask=rgba.split()[-1])
        return flat
    return img.convert("RGB")


def _load_image(data: bytes, max_pages: int) -> list[Page]:
    try:
        with Image.open(io.BytesIO(data)) as src:
            pages: list[Page] = []
            for frame in ImageSequence.Iterator(src):
                upright = ImageOps.exif_transpose(frame)  # camera orientation
                pages.append(Page(image=limit_side(_to_rgb(upright), MAX_SIDE)))
                if len(pages) >= max_pages:
                    break
            return pages
    except MlError:
        raise
    except Exception as exc:
        raise MlError("UNREADABLE_SOIL_CARD", f"The image could not be opened ({type(exc).__name__})") from exc


# ----------------------------------------------------------------------------- PDF


def _load_pdf(data: bytes, max_pages: int) -> list[Page]:
    try:
        import pypdfium2 as pdfium
    except ImportError as exc:
        raise MlError("UNREADABLE_SOIL_CARD", "PDF support is not installed on the server") from exc

    with _PDFIUM_LOCK:
        try:
            pdf = pdfium.PdfDocument(data)
        except Exception as exc:  # password-protected or damaged
            raise MlError(
                "UNREADABLE_SOIL_CARD", "The PDF could not be opened (it may be password-protected or damaged)"
            ) from exc
        try:
            total = len(pdf)
            if total == 0:
                raise MlError("UNREADABLE_SOIL_CARD", "The PDF has no pages")
            pages: list[Page] = []
            for index in range(min(total, max_pages)):
                pages.append(_render_pdf_page(pdf[index]))
            return pages
        except MlError:
            raise
        except Exception as exc:
            raise MlError("UNREADABLE_SOIL_CARD", f"The PDF could not be read ({type(exc).__name__})") from exc
        finally:
            pdf.close()


def _render_pdf_page(page) -> Page:
    left, bottom, right, top = page.get_cropbox()
    width_pt, height_pt = max(right - left, 1.0), max(top - bottom, 1.0)
    scale = min(PDF_RENDER_SIDE / max(width_pt, height_pt), 5.0)
    image = _to_rgb(page.render(scale=scale).to_pil())

    cells = None
    if not page.get_rotation():  # text-layer coordinates are only simple on unrotated pages
        try:
            cells = _pdf_text_cells(page, left, top, scale)
        except Exception:
            cells = None  # fall back to reading the rendered pixels
    return Page(image=image, cells=cells)


def _pdf_text_cells(page, left: float, top: float, scale: float) -> list[OcrWord] | None:
    """Group a digital PDF's characters into table-cell sized text boxes, in rendered-pixel coordinates."""
    textpage = page.get_textpage()
    try:
        count = textpage.count_chars()
        if count < 20:
            return None
        text = textpage.get_text_range(0, count)
        if len(text) != count:  # surrogate pairs shift indices: take the slow, exact path
            text = "".join(textpage.get_text_range(i, 1) for i in range(count))
        cells: list[OcrWord] = []
        buf: list[str] = []
        box: list[float] | None = None  # x0, y0, x1, y1 in PDF points (y up)
        last_x1 = 0.0

        def flush() -> None:
            nonlocal buf, box
            raw = "".join(buf).strip()
            if raw and box:
                x0, y0, x1, y1 = box
                cells.append(
                    OcrWord(
                        text=raw,
                        conf=1.0,
                        x0=(x0 - left) * scale,
                        y0=(top - y1) * scale,
                        x1=(x1 - left) * scale,
                        y1=(top - y0) * scale,
                        th=(y1 - y0) * scale,
                    )
                )
            buf, box = [], None

        for i, ch in enumerate(text):
            if ch in "\r\n":
                flush()
                continue
            l, b, r, t = textpage.get_charbox(i)
            if r - l <= 0 and not ch.strip():
                if buf:
                    buf.append(" ")
                continue
            height = max(t - b, 1.0)
            if box is not None:
                new_line = abs(((b + t) / 2) - ((box[1] + box[3]) / 2)) > 0.5 * height
                big_gap = (l - last_x1) > 1.0 * height  # a table-cell gap, not a word space
                if new_line or big_gap:
                    flush()
            if ch.strip():
                box = [l, b, r, t] if box is None else [min(box[0], l), min(box[1], b), max(box[2], r), max(box[3], t)]
                last_x1 = r
            buf.append(ch)
        flush()
        return cells or None
    finally:
        textpage.close()
