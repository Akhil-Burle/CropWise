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


def build_values(readings: dict[str, dict[str, Any]]) -> list[dict[str, Any]]:
    """readings: key -> {value, confidence, region}. Missing keys become empty rows to fill in."""
    values: list[dict[str, Any]] = []
    for key in NUTRIENT_KEYS:
        unit, low, high, _, _ = NORMS[key]
        r = readings.get(key) or {}
        value = r.get("value")
        confidence = r.get("confidence")
        status, label = classify(key, value) if value is not None else (None, None)
        region = r.get("region")
        values.append(
            {
                "key": key,
                "value": value,
                "unit": unit,
                "status": status,
                "statusLabel": label,
                "range": {"low": low, "high": high},
                "confidence": confidence,
                "needsReview": value is None or (confidence is not None and confidence < REVIEW_THRESHOLD),
                "region": {"x": region[0], "y": region[1], "w": region[2], "h": region[3]} if region else None,
            }
        )
    return values
