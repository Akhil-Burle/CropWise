# Soil Health Card OCR

Separate from leaf classification. It is implemented where it is served, in
[`backend/cropwise_api/ml/soil/`](../../../backend/cropwise_api/ml/soil/), and described in
[backend/README.md](../../../backend/README.md#how-a-soil-report-is-read). This folder holds no code.

What it does: reads a photo, scan or PDF of a soil test report locally (RapidOCR, the PaddleOCR PP-OCR models on ONNX
Runtime), extracts N, P, K, pH, EC and OC with units converted to kg/ha, dS/m and %, per-field confidence and
image-relative boxes, and leaves anything unreadable blank with a reason so the farmer can fill it in and confirm.

Integration: implement the `SoilCardReader` protocol from `backend/cropwise_api/ml/base.py` (`read(bytes, mime) ->
SoilCardResult`, raising `MlError("UNREADABLE_SOIL_CARD", ...)` when a card cannot be read) and return it from
`build_soil_reader` in `backend/cropwise_api/ml/registry.py`. To keep this reader but change the OCR engine, implement
`OcrEngine` in `ml/soil/engine.py`.

No training happens here: the PP-OCR models are used as shipped. Not measured on real field photos yet.
