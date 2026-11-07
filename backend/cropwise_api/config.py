"""Runtime settings. Everything is local: no hosted services, no secrets.

Every value can be overridden with an environment variable (prefix ``CROPWISE_``).
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]


def _env(name: str, default: str) -> str:
    return os.environ.get(f"CROPWISE_{name}", default)


def _csv(value: str) -> list[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


@dataclass(frozen=True)
class Settings:
    #: URL prefix of every route. The web app's VITE_API_BASE_URL must match it.
    api_prefix: str = field(default_factory=lambda: _env("API_PREFIX", "/api"))
    #: Uploads and analysis records live here (git-ignored).
    storage_dir: Path = field(default_factory=lambda: Path(_env("STORAGE_DIR", str(REPO_ROOT / "backend" / "storage"))))
    #: Which leaf model serves requests: "cnn" today, "vit" once it is trained.
    leaf_model: str = field(default_factory=lambda: _env("LEAF_MODEL", "cnn"))
    #: Checkpoint file for the chosen model. Empty = default for that model.
    leaf_checkpoint: str = field(default_factory=lambda: _env("LEAF_CHECKPOINT", ""))
    #: "cpu" (default, always works), "auto" (cuda > xpu > cpu), or an explicit torch device.
    device: str = field(default_factory=lambda: _env("DEVICE", "cpu"))
    #: Below this top-1 confidence the UI tells the farmer to consult an expert.
    confidence_threshold: float = field(default_factory=lambda: float(_env("CONFIDENCE_THRESHOLD", "0.70")))
    #: If the selected crop owns less than this share of the model's probability mass, the photo is
    #: diagnosed as the crop the model actually sees (and the result says so).
    min_crop_mass: float = field(default_factory=lambda: float(_env("MIN_CROP_MASS", "0.20")))
    #: Upload size cap per file. Phone photos are large; the web app compresses images before sending.
    max_upload_bytes: int = field(default_factory=lambda: int(_env("MAX_UPLOAD_BYTES", str(25 * 1024 * 1024))))
    #: Soil card reader: "rapidocr" (local OCR) or "unavailable" (cards are stored, values typed by hand).
    soil_reader: str = field(default_factory=lambda: _env("SOIL_READER", "rapidocr"))
    #: Pages of a PDF / multi-page scan that are read (the rest are ignored).
    ocr_max_pages: int = field(default_factory=lambda: int(_env("OCR_MAX_PAGES", "4")))
    #: A value read with less confidence than this is left blank for the farmer to fill in.
    ocr_fill_min_confidence: float = field(default_factory=lambda: float(_env("OCR_FILL_MIN_CONFIDENCE", "0.50")))
    #: Browser origins allowed to call the API directly (the Vite proxy needs none of this).
    cors_origins: list[str] = field(
        default_factory=lambda: _csv(
            _env("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173")
        )
    )
    #: Load the model during startup (True) or lazily on first request (False).
    preload_model: bool = field(default_factory=lambda: _env("PRELOAD_MODEL", "1") != "0")

    @property
    def uploads_dir(self) -> Path:
        return self.storage_dir / "uploads"

    @property
    def analyses_dir(self) -> Path:
        return self.storage_dir / "analyses"


def get_settings() -> Settings:
    return Settings()
