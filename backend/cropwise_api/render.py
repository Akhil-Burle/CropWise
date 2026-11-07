"""Stored analysis record -> response payloads (AnalysisResult / AnalysisSummary)."""

from __future__ import annotations

from typing import Any

from . import soil as soil_rules
from .config import Settings
from .storage import UploadStore


def upload_url(settings: Settings, upload_id: str | None) -> str | None:
    return f"{settings.api_prefix}/uploads/{upload_id}/file" if upload_id else None


def render_soil(record: dict[str, Any], settings: Settings, uploads: UploadStore) -> tuple[dict | None, dict | None]:
    """Returns (soil report, soil error). The OCR error stays visible after manual entry."""
    soil = record.get("soil")
    overrides: dict[str, float] | None = record.get("soilOverrides")
    if soil is None and not overrides:
        return None, None

    error = (soil or {}).get("error")
    if error and not overrides:
        return None, error

    readings = {k: dict(v) for k, v in ((soil or {}).get("readings") or {}).items()}
    for key, value in (overrides or {}).items():
        readings[key] = {"value": value, "confidence": None, "region": None}

    upload = uploads.get(record["soilUploadId"]) if record.get("soilUploadId") else None
    # Highlight boxes and the card image only make sense for raster images (not a PDF).
    card_url = upload_url(settings, upload.id) if upload and upload.mime_type != "application/pdf" else None
    manual = bool(error) or not record.get("soilUploadId")
    report = {
        "id": f"soil-{record['id']}",
        "farmId": record["farmId"],
        "sampleDate": record.get("soilSampleDate") or (soil or {}).get("sampleDate"),
        "labName": (soil or {}).get("labName"),
        "cardImageUrl": card_url,
        "source": "manual" if manual else "ocr",
        "confirmed": bool(record.get("soilConfirmed")),
        "values": soil_rules.build_values(readings),
    }
    return report, error


def render_analysis(record: dict[str, Any], settings: Settings, uploads: UploadStore) -> dict[str, Any]:
    soil, soil_error = render_soil(record, settings, uploads)
    return {
        "id": record["id"],
        "createdAt": record["createdAt"],
        "farmId": record["farmId"],
        "farmName": None,
        "cropId": record["cropId"],
        "cropName": record["cropName"],
        "growthStage": record["growthStage"],
        "area": record["area"],
        "areaUnit": record["areaUnit"],
        "soil": soil,
        "soilError": soil_error,
        "diagnosis": record.get("diagnosis"),
        "diagnosisError": record.get("diagnosisError"),
        "soilConfirmed": bool(record.get("soilConfirmed")),
        "saved": bool(record.get("saved")),
    }


def summarize(record: dict[str, Any], settings: Settings, uploads: UploadStore) -> dict[str, Any]:
    r = render_analysis(record, settings, uploads)
    diagnosis = r["diagnosis"]
    partial = bool(r["soilError"] or r["diagnosisError"])
    has_soil = r["soil"] is not None
    needs_review = not partial and ((has_soil and not r["soilConfirmed"]) or bool(diagnosis and diagnosis["lowConfidence"]))
    return {
        "id": r["id"],
        "createdAt": r["createdAt"],
        "farmId": r["farmId"],
        "farmName": r["farmName"],
        "cropId": r["cropId"],
        "cropName": r["cropName"],
        "diseaseName": diagnosis["name"] if diagnosis else None,
        "isHealthy": diagnosis["isHealthy"] if diagnosis else None,
        "confidence": diagnosis["confidence"] if diagnosis else None,
        "status": "partial" if partial else "needs_review" if needs_review else "complete",
        "saved": r["saved"],
    }
