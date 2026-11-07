"""HTTP routes. Paths and payloads match what app/src/services/http/ calls."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, Request, Response, UploadFile
from fastapi.responses import FileResponse

from . import soil as soil_rules
from .diagnosis import humanize, model_crops
from .ml.base import MlError
from .previews import ensure_preview
from .render import preview_url, render_analysis, render_soil, summarize
from .schemas import (
    AnalysisInputIn,
    AnalysisPageOut,
    AnalysisResultOut,
    CropOut,
    ConfirmSoilIn,
    HealthOut,
    JobRefOut,
    JobStatusOut,
    Lang,
    SoilModelInputOut,
    UploadRefOut,
)
from .ml.base import MlError
from .state import AppState
from .storage import UploadRejected, is_valid_id

router = APIRouter()


def state(request: Request) -> AppState:
    return request.app.state.cropwise


St = Annotated[AppState, Depends(state)]


def _not_found(what: str) -> HTTPException:
    return HTTPException(status_code=404, detail=f"{what} not found")


# ---------------------------------------------------------------- health


@router.get("/health", response_model=HealthOut, tags=["system"])
def health(st: St) -> dict:
    model = st.leaf.loaded
    return {
        "status": "ok" if model else "degraded",
        "leafModel": st.settings.leaf_model,
        "modelId": model.info.model_id if model else None,
        "runId": model.info.run_id if model else None,
        "device": model.info.device if model else None,
        "numClasses": model.info.num_classes if model else None,
        "soilReader": st.soil_reader.name,
        "detail": None if model else (st.leaf.error or "Model not loaded yet"),
        "soilDetail": getattr(st.soil_reader, "reason", None) or None,
    }


# ---------------------------------------------------------------- crops


@router.get("/crops", response_model=list[CropOut], tags=["crops"])
def list_crops(st: St, lang: Lang = "en") -> list[dict]:  # noqa: ARG001 - English names only for now
    """Crops the loaded leaf model can diagnose (so the website never offers one it cannot read)."""
    try:
        labels = st.leaf.get().labels
    except MlError as exc:
        raise HTTPException(status_code=503, detail={"message": exc.message}) from exc
    return [
        {"id": crop, "name": humanize(crop), "scientificName": None, "contentLang": "en"}
        for crop in sorted(model_crops(labels) - {""})
    ]


# ---------------------------------------------------------------- uploads


@router.post("/uploads", response_model=UploadRefOut, status_code=201, tags=["uploads"])
async def create_upload(
    st: St,
    file: Annotated[UploadFile, File()],
    kind: Annotated[str, Form()],
    file_name: Annotated[str | None, Form(alias="fileName")] = None,
) -> dict:
    # Read at most limit+1 bytes so an oversized body never fills memory.
    data = await file.read(st.settings.max_upload_bytes + 1)
    try:
        record = st.uploads.save(kind, file_name or file.filename or "upload", file.content_type or "", data)
    except UploadRejected as exc:
        status = {"FILE_TOO_LARGE": 413, "FILE_TYPE": 415}.get(exc.code, 422)
        raise HTTPException(status_code=status, detail={"code": exc.code, "message": exc.message}) from exc
    return {
        "id": record.id,
        "kind": record.kind,
        "fileName": record.file_name,
        "mimeType": record.mime_type,
        "sizeBytes": record.size_bytes,
        "previewUrl": preview_url(st.settings, record),
        "isSample": False,
    }


@router.get("/uploads/{upload_id}/file", tags=["uploads"])
def get_upload_file(upload_id: str, st: St) -> FileResponse:
    record = st.uploads.get(upload_id)
    if record is None:
        raise _not_found("Upload")
    return FileResponse(
        st.uploads.path(upload_id),
        media_type=record.mime_type,
        headers={"X-Content-Type-Options": "nosniff", "Cache-Control": "private, max-age=3600"},
    )


@router.get("/uploads/{upload_id}/preview", tags=["uploads"])
def get_upload_preview(upload_id: str, st: St) -> FileResponse:
    """First page of a PDF / HEIC / TIFF as a JPEG a browser can show."""
    record = st.uploads.get(upload_id)
    if record is None:
        raise _not_found("Upload")
    try:
        path = ensure_preview(st.uploads, record)
    except MlError as exc:
        raise HTTPException(status_code=422, detail={"code": exc.code, "message": exc.message}) from exc
    return FileResponse(
        path,
        media_type="image/jpeg",
        headers={"X-Content-Type-Options": "nosniff", "Cache-Control": "private, max-age=3600"},
    )


@router.get("/uploads/{upload_id}/card", tags=["uploads"])
def get_soil_card_view(upload_id: str, st: St) -> FileResponse:
    """The upright page of a soil report that the OCR highlight boxes refer to."""
    if st.uploads.get(upload_id) is None or not st.uploads.has_derived(upload_id, "card.jpg"):
        raise _not_found("Soil card image")
    return FileResponse(
        st.uploads.derived_path(upload_id, "card.jpg"),
        media_type="image/jpeg",
        headers={"X-Content-Type-Options": "nosniff", "Cache-Control": "private, max-age=3600"},
    )


# ---------------------------------------------------------------- analysis jobs


@router.post("/analysis", response_model=JobRefOut, status_code=202, tags=["analysis"])
def submit_analysis(body: AnalysisInputIn, st: St) -> dict:
    field_errors: dict[str, str] = {}
    if not body.soil_upload_id and not body.leaf_upload_id:
        field_errors["uploads"] = "required"
    for field, upload_id, kind in (
        ("soilUploadId", body.soil_upload_id, "soil_card"),
        ("leafUploadId", body.leaf_upload_id, "leaf"),
    ):
        if upload_id is None:
            continue
        record = st.uploads.get(upload_id) if is_valid_id(upload_id) else None
        if record is None:
            field_errors[field] = "not_found"
        elif record.kind != kind:
            field_errors[field] = "wrong_kind"
    if field_errors:
        raise HTTPException(status_code=422, detail={"fieldErrors": field_errors})

    job = st.jobs.submit(body.model_dump(by_alias=True))
    return {"jobId": job.id}


def _job_or_404(st: AppState, job_id: str):
    job = st.jobs.get(job_id)
    if job is None:
        raise _not_found("Job")
    return job


@router.get("/analysis/jobs/{job_id}", response_model=JobStatusOut, tags=["analysis"])
def job_status(job_id: str, st: St) -> dict:
    job = _job_or_404(st, job_id)
    state_name = job.state
    if state_name == "queued":
        return {"state": "queued", "position": st.jobs.position(job.id)}
    if state_name == "processing":
        return {
            "state": "processing",
            "stage": job.stage,
            "progress": job.progress,
            "completedStages": list(job.completed_stages),
        }
    if state_name == "completed":
        return {"state": "completed", "analysisId": job.analysis_id, "parts": dict(job.parts)}
    if state_name == "failed":
        return {"state": "failed", "error": job.error}
    return {"state": "cancelled"}


@router.get("/analysis/jobs/{job_id}/result", response_model=AnalysisResultOut, tags=["analysis"])
def job_result(job_id: str, st: St, lang: Lang = "en") -> dict:  # noqa: ARG001 - English only for now
    job = _job_or_404(st, job_id)
    if job.state != "completed" or not job.analysis_id:
        raise HTTPException(status_code=422, detail={"fieldErrors": {"job": "not_ready"}})
    return _analysis_or_404(st, job.analysis_id)


@router.post("/analysis/jobs/{job_id}/cancel", status_code=204, tags=["analysis"])
def cancel_job(job_id: str, st: St) -> Response:
    st.jobs.cancel(_job_or_404(st, job_id))
    return Response(status_code=204)


@router.post("/analysis/jobs/{job_id}/retry", response_model=JobRefOut, status_code=202, tags=["analysis"])
def retry_job(job_id: str, st: St) -> dict:
    job = _job_or_404(st, job_id)
    return {"jobId": st.jobs.submit(dict(job.input)).id}


# ---------------------------------------------------------------- stored analyses


def _analysis_or_404(st: AppState, analysis_id: str) -> dict:
    record = st.repo.get(analysis_id)
    if record is None:
        raise _not_found("Analysis")
    return render_analysis(record, st.settings, st.uploads)


@router.get("/analysis", response_model=AnalysisPageOut, tags=["analysis"])
def list_analyses(
    st: St,
    lang: Lang = "en",  # noqa: ARG001
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(alias="pageSize", ge=1, le=100)] = 20,
    search: str | None = None,
    sort: str | None = None,
    farm_id: Annotated[str | None, Query(alias="farmId")] = None,
    crop_id: Annotated[str | None, Query(alias="cropId")] = None,
    status: str | None = None,
) -> dict:
    rows = [summarize(r, st.settings, st.uploads) for r in st.repo.all()]
    rows = [
        r
        for r in rows
        if (not farm_id or r["farmId"] == farm_id)
        and (not crop_id or r["cropId"] == crop_id)
        and (not status or r["status"] == status)
    ]
    if search:
        needle = search.strip().lower()
        rows = [
            r
            for r in rows
            if needle in " ".join(str(r[k] or "") for k in ("cropName", "diseaseName", "farmName")).lower()
        ]
    rows.sort(key=lambda r: r["createdAt"], reverse=sort != "oldest")
    total = len(rows)
    start = (page - 1) * page_size
    return {
        "items": rows[start : start + page_size],
        "page": page,
        "pageSize": page_size,
        "total": total,
        "hasMore": start + page_size < total,
    }


@router.get("/analysis/{analysis_id}", response_model=AnalysisResultOut, tags=["analysis"])
def get_analysis(analysis_id: str, st: St, lang: Lang = "en") -> dict:  # noqa: ARG001
    return _analysis_or_404(st, analysis_id)


@router.put("/analysis/{analysis_id}/soil", response_model=AnalysisResultOut, tags=["analysis"])
def confirm_soil(analysis_id: str, body: ConfirmSoilIn, st: St, lang: Lang = "en") -> dict:  # noqa: ARG001
    """The farmer's final answer for the review form. A parameter that is left out means "not on my report"."""
    record = st.repo.get(analysis_id)
    if record is None:
        raise _not_found("Analysis")

    submitted: dict[str, float] = {}
    errors: dict[str, str] = {}
    for item in body.values:
        if item.key in submitted:
            errors[item.key] = "duplicate"
            continue
        low, high = soil_rules.LIMITS[item.key]
        if not (low <= item.value <= high):  # also rejects NaN
            errors[item.key] = "range"
        submitted[item.key] = item.value
    if errors:
        raise HTTPException(status_code=422, detail={"fieldErrors": errors})

    # Keep only what differs from what the OCR read. None = the farmer says it is not on the report.
    ocr = ((record.get("soil") or {}).get("readings")) or {}
    overrides: dict[str, float | None] = {}
    for key in soil_rules.NUTRIENT_KEYS:
        new, old = submitted.get(key), (ocr.get(key) or {}).get("value")
        if new != old:
            overrides[key] = new
    final = {key: overrides[key] if key in overrides else (ocr.get(key) or {}).get("value") for key in soil_rules.NUTRIENT_KEYS}
    if all(value is None for value in final.values()):
        raise HTTPException(status_code=422, detail={"fieldErrors": {"values": "required"}})

    now = datetime.now(timezone.utc)
    updated = st.repo.update(
        analysis_id,
        soilOverrides=overrides or None,
        soilConfirmed=True,
        soilConfirmedAt=now.isoformat(timespec="seconds"),
        # A leaf-only analysis has no soil block yet; manual entry creates one to hang the values on.
        soil=record.get("soil") or {"readings": {}, "labName": None, "sampleDate": None, "error": None, "engine": None},
    )
    assert updated is not None
    report, _ = render_soil(updated, st.settings, st.uploads)
    assert report is not None
    updated = st.repo.update(
        analysis_id,
        soilModelInput=soil_rules.model_input(
            updated, report, overrides, (updated.get("soil") or {}).get("engine"), updated["soilConfirmedAt"]
        ),
    )
    assert updated is not None
    return render_analysis(updated, st.settings, st.uploads)


@router.get("/analysis/{analysis_id}/soil/model-input", response_model=SoilModelInputOut, tags=["analysis"])
def soil_model_input(analysis_id: str, st: St) -> dict:
    """Confirmed soil values in the fixed form a soil model will consume (no model uses them yet)."""
    record = st.repo.get(analysis_id)
    if record is None:
        raise _not_found("Analysis")
    if not record.get("soilConfirmed") or not record.get("soilModelInput"):
        raise HTTPException(status_code=409, detail={"message": "Soil values are not confirmed yet"})
    return record["soilModelInput"]


@router.delete("/analysis/{analysis_id}", status_code=204, tags=["analysis"])
def delete_analysis(analysis_id: str, st: St) -> Response:
    if not st.repo.delete(analysis_id):
        raise _not_found("Analysis")
    return Response(status_code=204)
