"""Turns raw per-class probabilities into the app's DiseasePrediction.

Model-agnostic: works for any ``LeafClassifier`` whose labels look like ``<crop>__leaf__<disease>``.
"""

from __future__ import annotations

from typing import Any

from .ml.base import ModelInfo

TOP_ALTERNATIVES = 3


def humanize(slug: str) -> str:
    text = slug.replace("_unspecified", "").replace("_", " ").strip()
    return text[:1].upper() + text[1:] if text else slug


def parse_label(label: str) -> tuple[str, str]:
    """'tomato__leaf__early_blight' -> ('tomato', 'early_blight')."""
    parts = label.split("__")
    if len(parts) >= 3:
        return parts[0], "__".join(parts[2:])
    if len(parts) == 2:
        return parts[0], parts[1]
    return "", label


def model_crops(labels: list[str]) -> set[str]:
    return {parse_label(label)[0] for label in labels}


def build_diagnosis(
    probs: dict[str, float],
    *,
    analysis_id: str,
    crop_id: str,
    info: ModelInfo,
    threshold: float,
    min_crop_mass: float,
    leaf_image_url: str | None,
) -> dict[str, Any]:
    """Crop-conditioned diagnosis that never dead-ends.

    The farmer tells us the crop, so the disease is chosen among that crop's classes and the
    probabilities are renormalised inside it. If the model puts almost no probability on the selected
    crop (wrong crop picked, or a crop the model has not seen), we classify over every class instead
    and say plainly which crop the photo looks like. The result then carries that crop.
    """
    crop_labels = [label for label in probs if parse_label(label)[0] == crop_id]
    mass = sum(probs[label] for label in crop_labels)

    if crop_labels and mass >= min_crop_mass:
        scoped = {label: probs[label] / mass for label in crop_labels}
    else:
        scoped = dict(probs)

    ranked = sorted(scoped.items(), key=lambda kv: kv[1], reverse=True)
    top_label, confidence = ranked[0]
    top_crop, top_disease = parse_label(top_label)
    healthy = top_disease == "healthy"

    def disease_id(label: str) -> str | None:
        crop, disease = parse_label(label)
        return None if disease == "healthy" else f"{crop}_{disease}"

    def display(label: str) -> str:
        _, disease = parse_label(label)
        return "Healthy" if disease == "healthy" else humanize(disease)

    confidence = min(max(confidence, 0.0), 1.0)
    note = ""
    if top_crop and top_crop != crop_id:
        seen, picked = humanize(top_crop).lower(), humanize(crop_id).lower()
        note = f"This photo looks like a {seen} leaf, not {picked}, so the result below is for {seen}. "
    return {
        "id": f"dx-{analysis_id}",
        "cropId": top_crop or crop_id,
        "diseaseId": disease_id(top_label),
        "name": display(top_label),
        "scientificName": None,
        "isHealthy": healthy,
        "confidence": confidence,
        "confidenceThreshold": threshold,
        "lowConfidence": confidence < threshold,
        "alternatives": [
            {"diseaseId": disease_id(label), "name": display(label), "probability": min(max(p, 0.0), 1.0)}
            for label, p in ranked[1 : 1 + TOP_ALTERNATIVES]
        ],
        "description": (
            note
            + f"Identified from the photo by the CropWise {info.model_id} model. "
            "Labels come from public datasets and have not been verified by an agronomist, "
            "so please confirm with your local Krishi Vigyan Kendra or agriculture officer."
        ),
        "symptoms": [],
        # The models classify; they do not measure severity or affected area.
        "severity": None,
        "affectedAreaPct": None,
        "leafImageUrl": leaf_image_url,
        "contentLang": "en",
        "modelId": info.model_id,
        "runId": info.run_id,
    }
