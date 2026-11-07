"""Analysis jobs: submit -> queue -> stages -> persisted result.

One worker thread runs jobs one at a time. That is deliberate: this is a single-machine
deployment, two simultaneous inferences would only fight over the same CPU/GPU, and a plain
queue gives the UI an honest "position in line".
"""

from __future__ import annotations

import io
import logging
import threading
import time
from collections import OrderedDict
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any

from PIL import Image

from .config import Settings
from .diagnosis import build_diagnosis, humanize
from .ml.base import LeafClassifier, MlError, SoilCardReader
from .storage import AnalysisRepo, UploadStore, new_id

log = logging.getLogger("cropwise.jobs")

STAGE_WEIGHT = {"cleaning": 1, "reading_soil": 4, "analysing_leaf": 3, "matching_protocols": 1}
MAX_JOBS_KEPT = 500


class ModelHost:
    """Owns the leaf model. Loads it once (at startup or on first use) and remembers failures."""

    def __init__(self, settings: Settings, factory) -> None:
        self._settings = settings
        self._factory = factory
        self._lock = threading.Lock()
        self._model: LeafClassifier | None = None
        self.error: str | None = None

    def get(self) -> LeafClassifier:
        with self._lock:
            if self._model is None:
                try:
                    self._model = self._factory(self._settings)
                    self.error = None
                except MlError as exc:
                    self.error = exc.message
                    raise
                except Exception as exc:  # torch/torchvision import or weight-loading problems
                    log.exception("Leaf model failed to load")
                    self.error = f"{type(exc).__name__}: {exc}"
                    raise MlError("SERVER", "The leaf model could not be loaded", retryable=True) from exc
            return self._model

    @property
    def loaded(self) -> LeafClassifier | None:
        return self._model


@dataclass
class Job:
    id: str
    input: dict[str, Any]
    created_at: float = field(default_factory=time.time)
    state: str = "queued"
    stage: str = "cleaning"
    progress: float = 0.0
    completed_stages: list[str] = field(default_factory=list)
    analysis_id: str | None = None
    parts: dict[str, str] = field(default_factory=lambda: {"soil": "skipped", "leaf": "skipped"})
    error: dict[str, Any] | None = None
    cancel: threading.Event = field(default_factory=threading.Event)


def _err(code: str, message: str, retryable: bool = False) -> dict[str, Any]:
    return {"code": code, "message": message, "retryable": retryable}


class JobManager:
    def __init__(
        self,
        settings: Settings,
        uploads: UploadStore,
        repo: AnalysisRepo,
        leaf: ModelHost,
        soil_reader: SoilCardReader,
    ) -> None:
        self._settings = settings
        self._uploads = uploads
        self._repo = repo
        self._leaf = leaf
        self._soil = soil_reader
        self._jobs: OrderedDict[str, Job] = OrderedDict()
        self._waiting: list[str] = []
        self._lock = threading.Lock()
        self._pool = ThreadPoolExecutor(max_workers=1, thread_name_prefix="analysis")

    # ------------------------------------------------------------ public API

    def submit(self, payload: dict[str, Any]) -> Job:
        job = Job(id=new_id("job"), input=payload)
        with self._lock:
            self._jobs[job.id] = job
            self._waiting.append(job.id)
            while len(self._jobs) > MAX_JOBS_KEPT:
                self._jobs.popitem(last=False)
        self._pool.submit(self._run, job)
        return job

    def get(self, job_id: str) -> Job | None:
        with self._lock:
            return self._jobs.get(job_id)

    def position(self, job_id: str) -> int | None:
        with self._lock:
            return self._waiting.index(job_id) + 1 if job_id in self._waiting else None

    def cancel(self, job: Job) -> None:
        job.cancel.set()
        if job.state in ("queued", "processing"):
            job.state = "cancelled"

    def shutdown(self) -> None:
        self._pool.shutdown(wait=False, cancel_futures=True)

    # ------------------------------------------------------------ worker

    def _run(self, job: Job) -> None:
        with self._lock:
            if job.id in self._waiting:
                self._waiting.remove(job.id)
        if job.cancel.is_set():
            job.state = "cancelled"
            return
        try:
            self._pipeline(job)
        except _Cancelled:
            job.state = "cancelled"
        except Exception:  # never let a bug leave the UI polling forever
            log.exception("Job %s crashed", job.id)
            job.error = _err("SERVER", "Analysis failed unexpectedly", retryable=True)
            job.state = "failed"

    def _begin(self, job: Job, stage: str, planned: list[str]) -> None:
        if job.cancel.is_set():
            raise _Cancelled
        total = sum(STAGE_WEIGHT[s] for s in planned)
        done = sum(STAGE_WEIGHT[s] for s in job.completed_stages)
        job.stage = stage
        job.progress = min(99.0, round(done / total * 100, 1))
        job.state = "processing"

    def _end(self, job: Job, stage: str) -> None:
        job.completed_stages.append(stage)

    def _pipeline(self, job: Job) -> None:
        inp = job.input
        soil_id, leaf_id = inp.get("soilUploadId"), inp.get("leafUploadId")
        planned = ["cleaning"]
        if soil_id:
            planned.append("reading_soil")
        if leaf_id:
            planned.append("analysing_leaf")
        planned.append("matching_protocols")

        analysis_id = new_id("an")

        # -- cleaning: make sure the stored bytes decode as images.
        self._begin(job, "cleaning", planned)
        leaf_image: Image.Image | None = None
        leaf_error: dict[str, Any] | None = None
        soil_bytes: bytes | None = None
        soil_mime = ""
        if leaf_id:
            try:
                leaf_image = Image.open(io.BytesIO(self._uploads.read_bytes(leaf_id)))
                leaf_image.load()
            except Exception:
                leaf_error = _err("UPLOAD_FAILED", "The leaf photo could not be opened", retryable=False)
        if soil_id:
            rec = self._uploads.get(soil_id)
            soil_bytes = self._uploads.read_bytes(soil_id)
            soil_mime = rec.mime_type if rec else ""
        self._end(job, "cleaning")

        # -- reading_soil
        soil_block: dict[str, Any] | None = None
        if soil_id and soil_bytes is not None:
            self._begin(job, "reading_soil", planned)
            soil_block = self._read_soil(soil_id, soil_bytes, soil_mime)
            job.parts["soil"] = "failed" if soil_block["error"] else "ok"
            self._end(job, "reading_soil")

        # -- analysing_leaf
        diagnosis: dict[str, Any] | None = None
        if leaf_id:
            self._begin(job, "analysing_leaf", planned)
            if leaf_image is not None:
                diagnosis, leaf_error = self._classify(leaf_image, analysis_id, inp)
            job.parts["leaf"] = "failed" if leaf_error or diagnosis is None else "ok"
            self._end(job, "analysing_leaf")

        # -- matching_protocols: assemble and persist the result.
        self._begin(job, "matching_protocols", planned)
        if job.parts["soil"] != "ok" and job.parts["leaf"] != "ok":
            first = (soil_block or {}).get("error") or leaf_error or _err("SERVER", "Nothing could be analysed", True)
            job.error = {**first, "message": "Nothing could be analysed"}
            job.state = "failed"
            return

        model = self._leaf.loaded
        # If the photo is a different crop than the one picked, the result belongs to the detected crop.
        crop_id = (diagnosis or {}).get("cropId") or inp["cropId"]
        self._repo.save(
            {
                "id": analysis_id,
                "createdAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
                "farmId": inp["farmId"],
                "cropId": crop_id,
                "cropName": humanize(crop_id),
                "selectedCropId": inp["cropId"],
                "growthStage": inp["growthStage"],
                "area": inp["area"],
                "areaUnit": inp["areaUnit"],
                "soilUploadId": soil_id,
                "leafUploadId": leaf_id,
                "soil": soil_block,
                "soilOverrides": None,
                "soilSampleDate": None,
                "soilConfirmed": False,
                "diagnosis": diagnosis,
                "diagnosisError": leaf_error,
                "saved": False,
                "modelId": model.info.model_id if model else None,
                "runId": model.info.run_id if model else None,
            }
        )
        self._end(job, "matching_protocols")
        if job.cancel.is_set():
            self._repo.delete(analysis_id)
            raise _Cancelled
        job.analysis_id = analysis_id
        job.progress = 100.0
        job.state = "completed"

    # ------------------------------------------------------------ steps

    def _read_soil(self, upload_id: str, data: bytes, mime: str) -> dict[str, Any]:
        empty = {"readings": {}, "labName": None, "sampleDate": None, "engine": None, "pages": 0}
        try:
            result = self._soil.read(data, mime)
        except MlError as exc:
            return {**empty, "error": _err(exc.code, exc.message, exc.retryable)}
        except Exception:
            log.exception("Soil reader crashed")
            return {**empty, "error": _err("UNREADABLE_SOIL_CARD", "Soil card could not be read")}
        if result.view_image:  # the upright page the highlight boxes refer to
            self._uploads.write_derived(upload_id, "card.jpg", result.view_image)
        readings = {
            r.key: {
                "value": r.value,
                "confidence": r.confidence,
                "region": list(r.region) if r.region else None,
                "reason": r.reason,
            }
            for r in result.readings
        }
        return {
            "readings": readings,
            "labName": result.lab_name,
            "sampleDate": result.sample_date,
            "engine": result.engine,
            "pages": result.pages,
            "error": None,
        }

    def _classify(self, image: Image.Image, analysis_id: str, inp: dict[str, Any]):
        try:
            model = self._leaf.get()
            probs = model.predict(image)
            diagnosis = build_diagnosis(
                probs,
                analysis_id=analysis_id,
                crop_id=inp["cropId"],
                info=model.info,
                threshold=self._settings.confidence_threshold,
                min_crop_mass=self._settings.min_crop_mass,
                leaf_image_url=f"{self._settings.api_prefix}/uploads/{inp['leafUploadId']}/file",
            )
            return diagnosis, None
        except MlError as exc:
            return None, _err(exc.code, exc.message, exc.retryable)
        except Exception:
            log.exception("Leaf classification failed")
            return None, _err("SERVER", "The leaf could not be analysed", retryable=True)


class _Cancelled(Exception):
    pass
