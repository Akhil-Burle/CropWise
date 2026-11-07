"""Wire format. Field names and shapes mirror app/src/services/schemas/* (camelCase JSON).

FastAPI validates every response against these models, so a drift from what the web app's
Zod schemas expect fails loudly here instead of as INVALID_RESPONSE in a farmer's browser.
"""

from __future__ import annotations

from typing import Annotated, Literal, Union

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel

Lang = Literal["en", "hi", "kn", "ta", "te", "mr", "bn", "gu", "ml", "pa", "or"]
AreaUnit = Literal["acre", "hectare"]
GrowthStage = Literal["vegetative", "flowering", "fruiting"]
NutrientKey = Literal["N", "P", "K", "pH", "EC", "OC"]
Stage = Literal["cleaning", "reading_soil", "analysing_leaf", "matching_protocols"]
PartStatus = Literal["ok", "failed", "skipped"]


class Wire(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


# ---------------------------------------------------------------- shared


class AppErrorOut(Wire):
    code: str
    message: str | None = None
    retryable: bool | None = None
    field_errors: dict[str, str] | None = None


# ---------------------------------------------------------------- uploads


class UploadRefOut(Wire):
    id: str
    kind: Literal["soil_card", "leaf"]
    file_name: str
    mime_type: str
    size_bytes: int | None = None
    preview_url: str | None = None
    is_sample: bool = False


# ---------------------------------------------------------------- analysis input


class AnalysisInputIn(Wire):
    farm_id: str = Field(min_length=1, max_length=120)
    crop_id: str = Field(min_length=1, max_length=60, pattern=r"^[a-z0-9_]+$")
    growth_stage: GrowthStage
    area: float = Field(gt=0, le=500)
    area_unit: AreaUnit
    soil_upload_id: str | None = None
    leaf_upload_id: str | None = None


class SoilValueIn(Wire):
    key: NutrientKey
    value: float


class ConfirmSoilIn(Wire):
    values: list[SoilValueIn] = Field(min_length=1, max_length=6)


class JobRefOut(Wire):
    job_id: str


# ---------------------------------------------------------------- job status


class QueuedOut(Wire):
    state: Literal["queued"] = "queued"
    position: int | None = None


class ProcessingOut(Wire):
    state: Literal["processing"] = "processing"
    stage: Stage
    progress: float = Field(ge=0, le=100)
    completed_stages: list[Stage] = []


class PartsOut(Wire):
    soil: PartStatus
    leaf: PartStatus


class CompletedOut(Wire):
    state: Literal["completed"] = "completed"
    analysis_id: str
    parts: PartsOut


class FailedOut(Wire):
    state: Literal["failed"] = "failed"
    error: AppErrorOut


class CancelledOut(Wire):
    state: Literal["cancelled"] = "cancelled"


JobStatusOut = Annotated[
    Union[QueuedOut, ProcessingOut, CompletedOut, FailedOut, CancelledOut], Field(discriminator="state")
]


# ---------------------------------------------------------------- results


class RangeOut(Wire):
    low: float | None = None
    high: float | None = None


class RegionOut(Wire):
    x: float
    y: float
    w: float
    h: float


class SoilValueOut(Wire):
    key: NutrientKey
    value: float | None = None
    unit: str
    status: Literal["deficient", "sufficient", "excess"] | None = None
    status_label: str | None = None
    range: RangeOut | None = None
    confidence: float | None = Field(default=None, ge=0, le=1)
    needs_review: bool = False
    region: RegionOut | None = None


class SoilReportOut(Wire):
    id: str
    farm_id: str
    sample_date: str | None = None
    lab_name: str | None = None
    card_image_url: str | None = None
    source: Literal["ocr", "manual", "lab"] = "ocr"
    confirmed: bool = False
    values: list[SoilValueOut]


class AlternativeOut(Wire):
    disease_id: str | None = None
    name: str
    probability: float = Field(ge=0, le=1)


class DiseasePredictionOut(Wire):
    id: str
    crop_id: str
    disease_id: str | None = None
    name: str
    scientific_name: str | None = None
    is_healthy: bool
    confidence: float = Field(ge=0, le=1)
    confidence_threshold: float = Field(ge=0, le=1)
    low_confidence: bool
    alternatives: list[AlternativeOut] = []
    description: str = ""
    symptoms: list[str] = []
    severity: Literal["none", "low", "moderate", "high"] | None = None
    affected_area_pct: float | None = None
    leaf_image_url: str | None = None
    content_lang: Lang = "en"
    #: Which model and training run produced this diagnosis (extra, ignored by the web app).
    model_id: str | None = None
    run_id: str | None = None


class AnalysisResultOut(Wire):
    id: str
    created_at: str
    farm_id: str
    farm_name: str | None = None
    crop_id: str
    crop_name: str
    growth_stage: GrowthStage
    area: float = Field(gt=0)
    area_unit: AreaUnit
    soil: SoilReportOut | None = None
    soil_error: AppErrorOut | None = None
    diagnosis: DiseasePredictionOut | None = None
    diagnosis_error: AppErrorOut | None = None
    soil_confirmed: bool = False
    saved: bool = False


class AnalysisSummaryOut(Wire):
    id: str
    created_at: str
    farm_id: str
    farm_name: str | None = None
    crop_id: str
    crop_name: str
    disease_name: str | None = None
    is_healthy: bool | None = None
    confidence: float | None = None
    status: Literal["complete", "partial", "needs_review"]
    saved: bool = False


class AnalysisPageOut(Wire):
    items: list[AnalysisSummaryOut]
    page: int
    page_size: int
    total: int
    has_more: bool


# ---------------------------------------------------------------- crops


class CropOut(Wire):
    id: str
    name: str
    scientific_name: str | None = None
    content_lang: Lang = "en"


# ---------------------------------------------------------------- health


class HealthOut(Wire):
    status: Literal["ok", "degraded"]
    leaf_model: str
    model_id: str | None = None
    run_id: str | None = None
    device: str | None = None
    num_classes: int | None = None
    soil_reader: str
    detail: str | None = None
