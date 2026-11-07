"""Soil value classification. Port of the norms in app/src/mock/engine/soil.ts
(Soil Health Card style ratings: kg/ha for N/P/K, pH, dS/m for EC, % for OC)."""

from __future__ import annotations

from typing import Any

NUTRIENT_KEYS = ["pH", "EC", "OC", "N", "P", "K"]
REVIEW_THRESHOLD = 0.75

#: key -> (unit, low, high, status above `high`, (label below, label within, label above))
NORMS: dict[str, tuple[str, float | None, float | None, str, tuple[str, str, str] | None]] = {
    "N": ("kg/ha", 280, 560, "excess", None),
    "P": ("kg/ha", 10, 25, "excess", None),
    "K": ("kg/ha", 110, 280, "excess", None),
    "pH": ("", 6.5, 7.5, "excess", ("Acidic", "Neutral", "Alkaline")),
    "EC": ("dS/m", None, 1.0, "excess", ("Normal", "Normal", "High salinity")),
    "OC": ("%", 0.5, 0.75, "sufficient", ("Low", "Medium", "High")),
}

#: Plausible physical limits, used to reject typos in manual entry.
LIMITS: dict[str, tuple[float, float]] = {
    "N": (0, 2000),
    "P": (0, 500),
    "K": (0, 3000),
    "pH": (0, 14),
    "EC": (0, 20),
    "OC": (0, 5),
}


def classify(key: str, value: float) -> tuple[str, str | None]:
    _, low, high, above, labels = NORMS[key]
    if low is not None and value < low:
        return "deficient", labels[0] if labels else None
    if high is not None and value > high:
        return above, labels[2] if labels else None
    return "sufficient", labels[1] if labels else None


#: Why a field needs the farmer's eyes. The web app has a message for each code.
REVIEW_REASONS = {
    "not_found",  # no value for this parameter on the report
    "unreadable",  # the number is there but smudged / cut off
    "low_confidence",  # read, but the OCR is not sure
    "ambiguous",  # two different values for the same parameter
    "out_of_range",  # not a possible value (a misread digit)
    "unit_unclear",  # printed in a unit we cannot convert
    "unit_converted",  # converted to the app's unit (e.g. ppm -> kg/ha)
    "unit_assumed",  # no unit printed; the usual one was assumed
    "decimal_repaired",  # "68" read as 6.8
    "digits_repaired",  # a letter read as a digit (O -> 0)
    "from_organic_matter",  # report gives organic matter; carbon was derived from it
    "unusual_value",  # possible but unusual for soil
}


def build_values(readings: dict[str, dict[str, Any]], reviewed: bool = False) -> list[dict[str, Any]]:
    """readings: key -> {value, confidence, region, reason}. Missing keys become empty rows to fill in.

    `reviewed` = the farmer already confirmed the form, so only genuinely empty fields stay flagged.
    """
    values: list[dict[str, Any]] = []
    for key in NUTRIENT_KEYS:
        unit, low, high, _, _ = NORMS[key]
        r = readings.get(key) or {}
        value = r.get("value")
        confidence = r.get("confidence")
        reason = r.get("reason")
        status, label = classify(key, value) if value is not None else (None, None)
        region = r.get("region")
        shaky = value is not None and confidence is not None and confidence < REVIEW_THRESHOLD
        if value is None:
            reason = reason or "not_found"
        elif shaky:
            reason = reason or "low_confidence"
        if reviewed and value is not None:
            reason, shaky = None, False
        values.append(
            {
                "key": key,
                "value": value,
                "unit": unit,
                "status": status,
                "statusLabel": label,
                "range": {"low": low, "high": high},
                "confidence": confidence,
                "needsReview": value is None or shaky or (reason in REVIEW_REASONS and not reviewed),
                "reviewReason": reason if reason in REVIEW_REASONS else None,
                "region": {"x": region[0], "y": region[1], "w": region[2], "h": region[3]} if region else None,
            }
        )
    return values


def model_input(
    analysis: dict[str, Any],
    report: dict[str, Any],
    overrides: dict[str, float | None],
    engine: str | None,
    confirmed_at: str,
) -> dict[str, Any]:
    """The confirmed soil values in the exact form a soil model will consume.

    Stable and self-describing: fixed units, no free text, and a record of where each number came
    from (read from the card, corrected by the farmer, typed by the farmer, or absent).
    """
    features: dict[str, float | None] = {}
    provenance: dict[str, dict[str, Any]] = {}
    status: dict[str, str | None] = {}
    units: dict[str, str] = {}
    for v in report["values"]:
        key = v["key"]
        features[key] = v["value"]
        units[key] = v["unit"]
        status[key] = v["status"]
        if v["value"] is None:
            origin = "missing"
        elif key in overrides:
            origin = "farmer_edited" if v["confidence"] is not None or v["region"] is not None else "farmer_entered"
        else:
            origin = "ocr"
        # confidence belongs to a number the OCR read and the farmer left alone; nothing else has one
        keep = origin == "ocr"
        provenance[key] = {"origin": origin, "confidence": v["confidence"] if keep else None}
    origins = {p["origin"] for p in provenance.values() if p["origin"] != "missing"}
    return {
        "schemaVersion": 1,
        "analysisId": analysis["id"],
        "farmId": analysis["farmId"],
        "cropId": analysis["cropId"],
        "growthStage": analysis["growthStage"],
        "sampleDate": report.get("sampleDate"),
        "features": features,
        "units": units,
        "status": status,
        "provenance": provenance,
        "complete": all(value is not None for value in features.values()),
        "source": "ocr" if origins == {"ocr"} else "manual" if "ocr" not in origins else "mixed",
        "ocrEngine": engine,
        "confirmedAt": confirmed_at,
    }
