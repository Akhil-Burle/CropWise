# ml/ (to be built)

- **Leaf disease model:** CNN (e.g. EfficientNet/MobileNetV3) or a Vision Transformer, trained on
  PlantVillage-style data plus field photos from Karnataka. Output must include calibrated
  probabilities: the app shows the top 3 and treats anything below the threshold (default 0.70,
  returned as `confidenceThreshold`) as "not sure – get it checked".
- **"Not a leaf" detection:** a reject class or OOD check, returned as the `LEAF_NOT_DETECTED` error.
- **Soil Health Card OCR:** detect the value cells, read N, P, K, pH, EC, OC with per-field confidence
  and bounding boxes (fractions of the image) – the OCR review screen draws them.
- **IndicTrans2 server (optional):** a tiny HTTP wrapper around AI4Bharat IndicTrans2 for
  `tools/i18n/translate.mjs --provider=indictrans2`.
- **Later:** a small TFLite version of the leaf model inside the Android app for a first answer with no
  network, confirmed by the server when the phone is back online.
