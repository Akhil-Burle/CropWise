"""Image preparation for OCR. Geometry-preserving except for explicit rotation, so the regions the
parser finds line up with the image the farmer sees on the review screen."""

from __future__ import annotations

import io
import statistics

import numpy as np
from PIL import Image

#: longest side of the image that is read and shown (phone photos are 3000-4000 px)
MAX_SIDE = 2400
#: smaller images are enlarged to about this size before reading
MIN_READ_SIDE = 1400


def limit_side(img: Image.Image, max_side: int = MAX_SIDE) -> Image.Image:
    longest = max(img.size)
    if longest <= max_side:
        return img
    scale = max_side / longest
    return img.resize((round(img.width * scale), round(img.height * scale)), Image.LANCZOS)


def rotate_quarter(img: Image.Image, degrees_ccw: int) -> Image.Image:
    ops = {
        0: None,
        90: Image.Transpose.ROTATE_90,
        180: Image.Transpose.ROTATE_180,
        270: Image.Transpose.ROTATE_270,
    }
    op = ops[degrees_ccw % 360]
    return img if op is None else img.transpose(op)


def _border_colour(img: Image.Image) -> tuple[int, int, int]:
    arr = np.asarray(img.convert("RGB"))
    edge = np.concatenate([arr[0], arr[-1], arr[:, 0], arr[:, -1]])
    r, g, b = np.median(edge, axis=0)
    return int(r), int(g), int(b)


def deskew(img: Image.Image, angle_ccw: float) -> Image.Image:
    """Straighten by rotating `angle_ccw` degrees counter-clockwise, keeping the whole page.

    The new corners take the photo's own border colour: a white wedge next to a dark table makes the
    text detector lose the card.
    """
    return img.rotate(angle_ccw, resample=Image.BICUBIC, expand=True, fillcolor=_border_colour(img))


def median_skew(angles_and_weights: list[tuple[float, float]]) -> float:
    """Weighted median of text-baseline angles (degrees); 0 when there is no usable text."""
    usable = [(a, w) for a, w in angles_and_weights if abs(a) < 45 and w > 0]
    if len(usable) < 4:
        return 0.0
    usable.sort()
    half = sum(w for _, w in usable) / 2
    acc = 0.0
    for angle, weight in usable:
        acc += weight
        if acc >= half:
            return angle
    return statistics.median(a for a, _ in usable)


def ocr_array(img: Image.Image) -> np.ndarray:
    """RGB array to read: enlarged if tiny, contrast-lifted if dark or washed out.

    Same aspect ratio as `img`, so normalised coordinates carry over.
    """
    rgb = img.convert("RGB")
    longest = max(rgb.size)
    if longest < MIN_READ_SIDE:
        scale = min(3.0, MIN_READ_SIDE / longest)
        rgb = rgb.resize((round(rgb.width * scale), round(rgb.height * scale)), Image.LANCZOS)
    arr = np.asarray(rgb)
    gray = np.asarray(rgb.convert("L"))
    lo, hi = np.percentile(gray, (2, 98))
    if (hi - lo) < 90 or gray.mean() < 70:
        import cv2

        lab = cv2.cvtColor(arr, cv2.COLOR_RGB2LAB)
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
        lab[:, :, 0] = clahe.apply(lab[:, :, 0])
        arr = cv2.cvtColor(lab, cv2.COLOR_LAB2RGB)
    return arr


def to_jpeg(img: Image.Image, max_side: int = 2200, quality: int = 88) -> bytes:
    out = io.BytesIO()
    limit_side(img.convert("RGB"), max_side).save(out, format="JPEG", quality=quality, optimize=True)
    return out.getvalue()
