"""Disk storage for uploads and analysis records. Plain files, no database.

    storage/uploads/<id>.bin   the validated bytes
    storage/uploads/<id>.json  metadata
    storage/analyses/<id>.json one analysis record
"""

from __future__ import annotations

import io
import json
import os
import re
import threading
import uuid
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any

from PIL import Image, UnidentifiedImageError

from .config import Settings

ID_RE = re.compile(r"^[a-z]{2,6}_[0-9a-f]{32}$")

#: kind -> accepted mime types (mirrors DEFAULT_CONSTRAINTS in app/src/services/upload/pipeline.ts)
ACCEPTED: dict[str, set[str]] = {
    "leaf": {"image/jpeg", "image/png", "image/webp"},
    "soil_card": {"image/jpeg", "image/png", "application/pdf"},
}
PIL_FORMAT_TO_MIME = {"JPEG": "image/jpeg", "PNG": "image/png", "WEBP": "image/webp"}

Image.MAX_IMAGE_PIXELS = 60_000_000  # decompression-bomb guard


class UploadRejected(Exception):
    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code = code
        self.message = message


def new_id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex}"


def is_valid_id(value: str) -> bool:
    return bool(ID_RE.match(value))


def _atomic_write(path: Path, data: bytes) -> None:
    tmp = path.with_suffix(path.suffix + f".{uuid.uuid4().hex}.tmp")
    tmp.write_bytes(data)
    os.replace(tmp, path)


@dataclass
class UploadRecord:
    id: str
    kind: str
    file_name: str
    mime_type: str
    size_bytes: int


class UploadStore:
    def __init__(self, settings: Settings) -> None:
        self._dir = settings.uploads_dir
        self._max = settings.max_upload_bytes
        self._dir.mkdir(parents=True, exist_ok=True)

    def save(self, kind: str, file_name: str, claimed_mime: str, data: bytes) -> UploadRecord:
        if kind not in ACCEPTED:
            raise UploadRejected("VALIDATION", f"Unknown upload kind '{kind}'")
        if not data:
            raise UploadRejected("UPLOAD_FAILED", "File is empty")
        if len(data) > self._max:
            raise UploadRejected("FILE_TOO_LARGE", "File is too large")

        # Trust the bytes, not the browser's Content-Type.
        mime = self._sniff(data)
        if mime is None or mime not in ACCEPTED[kind]:
            raise UploadRejected("FILE_TYPE", f"Unsupported file type ({claimed_mime or 'unknown'})")

        record = UploadRecord(
            id=new_id("up"),
            kind=kind,
            file_name=self._clean_name(file_name),
            mime_type=mime,
            size_bytes=len(data),
        )
        _atomic_write(self._dir / f"{record.id}.bin", data)
        _atomic_write(self._dir / f"{record.id}.json", json.dumps(asdict(record)).encode())
        return record

    def get(self, upload_id: str) -> UploadRecord | None:
        if not is_valid_id(upload_id):
            return None
        meta = self._dir / f"{upload_id}.json"
        if not meta.is_file():
            return None
        return UploadRecord(**json.loads(meta.read_text()))

    def read_bytes(self, upload_id: str) -> bytes:
        return (self._dir / f"{upload_id}.bin").read_bytes()

    def path(self, upload_id: str) -> Path:
        return self._dir / f"{upload_id}.bin"

    @staticmethod
    def _sniff(data: bytes) -> str | None:
        if data[:5] == b"%PDF-":
            return "application/pdf"
        try:
            with Image.open(io.BytesIO(data)) as img:
                img.verify()
                return PIL_FORMAT_TO_MIME.get(img.format or "")
        except (UnidentifiedImageError, OSError, SyntaxError, Image.DecompressionBombError):
            return None

    @staticmethod
    def _clean_name(name: str) -> str:
        base = os.path.basename((name or "upload").replace("\\", "/"))
        base = re.sub(r"[^\w.\- ]", "_", base)[:120]
        return base or "upload"


class AnalysisRepo:
    """JSON file per analysis. Writes are atomic; a lock serialises read-modify-write."""

    def __init__(self, settings: Settings) -> None:
        self._dir = settings.analyses_dir
        self._dir.mkdir(parents=True, exist_ok=True)
        self._lock = threading.RLock()

    def save(self, record: dict[str, Any]) -> None:
        with self._lock:
            _atomic_write(self._dir / f"{record['id']}.json", json.dumps(record).encode())

    def get(self, analysis_id: str) -> dict[str, Any] | None:
        if not is_valid_id(analysis_id):
            return None
        path = self._dir / f"{analysis_id}.json"
        with self._lock:
            if not path.is_file():
                return None
            return json.loads(path.read_text())

    def update(self, analysis_id: str, **changes: Any) -> dict[str, Any] | None:
        with self._lock:
            record = self.get(analysis_id)
            if record is None:
                return None
            record.update(changes)
            self.save(record)
            return record

    def delete(self, analysis_id: str) -> bool:
        if not is_valid_id(analysis_id):
            return False
        with self._lock:
            path = self._dir / f"{analysis_id}.json"
            if not path.is_file():
                return False
            path.unlink()
            return True

    def all(self) -> list[dict[str, Any]]:
        with self._lock:
            out: list[dict[str, Any]] = []
            for path in self._dir.glob("an_*.json"):
                try:
                    out.append(json.loads(path.read_text()))
                except (OSError, json.JSONDecodeError):
                    continue
            return out
