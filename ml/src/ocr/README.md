# Soil Health Card OCR — planned

Separate from leaf classification. Extract N, P, K, pH, EC and OC with units, per-field confidence and image-relative bounding boxes. Preserve unreadable fields and support user confirmation. No OCR implementation exists yet.

Integration: implement the `SoilCardReader` protocol from `backend/cropwise_api/ml/base.py` (`read(bytes, mime) ->
SoilCardResult`, raising `MlError("UNREADABLE_SOIL_CARD", ...)` when a card cannot be read) and return it from
`build_soil_reader` in `backend/cropwise_api/ml/registry.py`. Until then uploaded cards report
`UNREADABLE_SOIL_CARD` and the website offers manual entry of the six values.
