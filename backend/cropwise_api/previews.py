"""Browser-friendly JPEG previews for uploads a browser cannot show itself (PDF, HEIC, TIFF)."""

from __future__ import annotations

from pathlib import Path

from .ml.base import MlError
from .storage import UploadRecord, UploadStore


def ensure_preview(uploads: UploadStore, record: UploadRecord) -> Path:
    """First page as a JPEG, generated once and cached next to the upload. Raises MlError if unreadable."""
    if not uploads.has_derived(record.id, "preview.jpg"):
        from .ml.soil.documents import load_pages
        from .ml.soil.imaging import to_jpeg

        pages = load_pages(uploads.read_bytes(record.id), record.mime_type, max_pages=1)
        uploads.write_derived(record.id, "preview.jpg", to_jpeg(pages[0].image, 1600))
    return uploads.derived_path(record.id, "preview.jpg")
