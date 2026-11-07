"""Application state shared by the routes (built once in the lifespan)."""

from __future__ import annotations

from dataclasses import dataclass

from .config import Settings
from .jobs import JobManager, ModelHost
from .ml.base import SoilCardReader
from .storage import AnalysisRepo, UploadStore


@dataclass
class AppState:
    settings: Settings
    uploads: UploadStore
    repo: AnalysisRepo
    leaf: ModelHost
    soil_reader: SoilCardReader
    jobs: JobManager
