# backend/ – local ML API

FastAPI service that carries the farmer's **leaf photo** and **soil card** from the website to the
ML models and returns the result. Everything runs on this machine: no hosted services, binds to
`127.0.0.1` only, files are stored under `backend/storage/` (git-ignored).

```
Browser ──/api──▶ Vite proxy ──▶ FastAPI (:8000) ──▶ job queue (1 worker) ──▶ LeafClassifier (CNN today, ViT later)
                                      │                                    └─▶ SoilCardReader (local OCR)
                                      └─ storage/uploads, storage/analyses
```

## Run it

```bash
# once: install the API dependencies into the ML virtualenv (it already has PyTorch).
# This includes the soil-report OCR (RapidOCR + ONNX Runtime), PDF and HEIC support; no model downloads.
ml/.venv/bin/python -m pip install -r backend/requirements.txt

# terminal 1 – API (loads the CNN checkpoint, then listens on 127.0.0.1:8000)
backend/start.sh

# terminal 2 – website talking to it
cd app && npm run dev:local        # http://localhost:5173
```

Check it: `curl localhost:8000/api/health` shows the loaded leaf model, run id and device, and the soil reader
(`rapidocr-pp-ocrv6`, or `unavailable` with the reason in `soilDetail`).

Try the soil flow: upload a file from `images_test/soil_cards/` as the soil card in the website, or with curl:
`curl -F kind=soil_card -F file=@images_test/soil_cards/soil-card-hassan.pdf localhost:8000/api/uploads`.
Interactive docs: http://127.0.0.1:8000/docs

## What the website does

`VITE_DATA_SOURCE=local` (the `dev:local` script) sends **uploads and analysis** to this API and keeps
everything else (login, farms, learning content) on mock data. See `app/src/services/source.local.ts`.
The browser always calls `/api/...`; the Vite dev/preview server forwards it to `http://127.0.0.1:8000`
(override with `CROPWISE_API_URL`), so there is no CORS.

In this mode:

- **Crop picker** lists every crop the loaded model can diagnose (`GET /crops`), not the 3 demo crops.
  If the API is unreachable it falls back to the demo list.
- **Soil report review.** After upload and analysis, the farmer lands on a review page: the report image with the
  OCR's boxes highlighted next to a form. Read values are filled in, doubtful ones are highlighted with a reason,
  unreadable ones are empty. Empty boxes may stay empty ("not on my report"); at least one value is required.
  PDFs, HEIC and TIFF files get a JPEG preview. Photos up to 25 MB are accepted (they are shrunk before sending).
- **Sample buttons are hidden.** The bundled samples are SVGs the model cannot read; use real photos
  (for example from `ml/data/processed/releases/<release>/imagefolder/test/`).
- **Advice is bridged to the demo engine.** The mock advisory engine only knows its own database, so each real
  analysis is registered with it (`syncShadowAnalysis`) to make advice, save, share and spray reminders work.
  The screen always shows the model's real disease name, confidence and crop. Spray protocols exist in the demo
  engine for only 3 diseases (`tomato_early_blight`, `tomato_septoria_leaf_spot`, `potato_late_blight`, mapped in
  `MOCK_PROTOCOL`); every other diagnosis gets general organic guidance, **no chemical dose**, and the message
  "No chemical advice for this problem yet" (`chemicalUnavailableReason: "no_protocol"`). The app's
  "demo data, not for real agricultural use" banner stays on.

## Endpoints (prefix `/api`)

| Method & path | Purpose |
| --- | --- |
| `GET /health` | model, run id, device, soil reader |
| `GET /crops` | crops the loaded model can diagnose (the website's crop picker uses this) |
| `POST /uploads` | multipart `kind` (`leaf` \| `soil_card`) + `file` → `UploadRef`. File type is checked from the bytes, not the browser's header |
| `GET /uploads/{id}/file` | the stored upload as sent |
| `GET /uploads/{id}/preview` | first page of a PDF / HEIC / TIFF as a JPEG a browser can show |
| `GET /uploads/{id}/card` | the upright page of a soil report that the OCR highlight boxes refer to |
| `POST /analysis` | `AnalysisInput` → `{jobId}` (202) |
| `GET /analysis/jobs/{jobId}` | `queued` / `processing(stage, progress)` / `completed(parts)` / `failed(error)` / `cancelled` |
| `GET /analysis/jobs/{jobId}/result` | `AnalysisResult` |
| `POST /analysis/jobs/{jobId}/cancel` · `/retry` | cancel, or re-run with the same input |
| `GET /analysis` · `GET /analysis/{id}` · `DELETE /analysis/{id}` | history |
| `PUT /analysis/{id}/soil` | the farmer's final answer for the review form (range-checked). A parameter left out means "not on my report"; at least one value is required |
| `GET /analysis/{id}/soil/model-input` | the confirmed values in the fixed form a soil model will consume (409 until confirmed) |

Payload shapes live in `cropwise_api/schemas.py` and mirror `app/src/services/schemas/`. FastAPI validates
every response against them. The exported spec is `contracts/openapi.json`; regenerate with
`curl localhost:8000/openapi.json | python3 -m json.tool > contracts/openapi.json`.

## How a diagnosis is produced

1. Upload bytes are verified (real image/PDF, size cap) and stored.
2. A job runs through the stages the UI already shows: `cleaning` → `reading_soil` → `analysing_leaf` → `matching_protocols`.
   One worker thread runs jobs in order, so the machine is never asked to run two inferences at once.
3. The model returns a probability for every class. `diagnosis.py` then uses the **crop the farmer selected**:
   the disease is chosen among that crop's classes and renormalised. If the model puts less than
   `CROPWISE_MIN_CROP_MASS` (0.20) of its probability on that crop (wrong crop picked, or a crop it has never
   seen), it diagnoses over all classes instead and the result carries the crop the photo actually looks like,
   with a plain note saying so. Nothing is rejected: a photo that is not a leaf simply comes back with a low
   confidence (under `CROPWISE_CONFIDENCE_THRESHOLD`, 0.70), which the UI shows as "not sure, ask an expert".
4. Each diagnosis carries `modelId` and `runId` so results stay traceable to a checkpoint.

Partial results work as the UI expects: if only one of leaf/soil succeeds the analysis completes with
`soilError` or `diagnosisError`; if neither does the job `failed`s (for example an unreadable soil card with no leaf photo).

## How a soil report is read

Upload a photo (camera or gallery), a scan or a PDF. `ml/soil/` then reads it entirely on this machine:

1. **Load.** JPEG (incl. Android MPO), PNG, WebP, HEIC/HEIF (iPhone), TIFF (multi-page scans) and PDF. Camera
   orientation (EXIF) is applied. A PDF with a text layer is read exactly from that text; a scanned PDF is
   rendered and OCR'd. Up to `CROPWISE_OCR_MAX_PAGES` pages (4) are read and the best page is shown.
2. **Straighten.** Photos taken at an angle are levelled, and sideways or upside-down cards are rotated upright
   (the orientation with the most recognisable parameters wins). Dark or washed-out photos get a contrast lift.
3. **OCR.** [RapidOCR](https://github.com/RapidAI/RapidOCR) with the PP-OCR models: the PaddleOCR model family on
   ONNX Runtime, CPU only, ~2 s per page. The models are inside the pip wheel, so nothing is downloaded or sent
   anywhere. (PaddleOCR itself needs PaddlePaddle, which has no wheel for current Python versions.)
4. **Extract.** `parser.py` is layout-independent. It finds parameter names (pH, EC / electrical conductivity,
   organic carbon, N, P, K, with common spellings and a few Hindi/Kannada words), then the value that belongs to each:
   inline (`pH : 6.8`), in the same table row, under the name (column-style tables), or in the column headed
   "Test value / Result". It ignores normal ranges, ratings, serial numbers, dates, method codes (`P2O5`, `1:2.5`)
   and fertiliser advice. It also reads the sampling date and the lab name.
5. **Normalise units** to what the app uses (N, P, K in kg/ha; EC in dS/m; OC in %): ppm / mg/kg, kg/acre, lb/acre,
   mg/100 g, µS/cm, mS/m and g/kg are converted, and organic matter is turned into organic carbon when that is all the
   report has. Anything converted or assumed is flagged for the farmer.
6. **Decide what to fill.** A value is filled in only if it is read with at least `CROPWISE_OCR_FILL_MIN_CONFIDENCE`
   (0.50) and is possible for soil. Anything else is left **blank** with a reason (`not_found`, `unreadable`,
   `low_confidence`, `ambiguous`, `out_of_range`, `unit_unclear`, ...), and the box where it was seen is highlighted on
   the card. Filled values below 0.75 confidence, or with a flagged reason, are marked "please check".

The website's review screen shows the card image with these highlights next to a form. Boxes the OCR could not fill
are empty, each with its reason; the farmer completes or corrects them, leaves empty what is not on the report, and
confirms (`PUT /analysis/{id}/soil`).

### What the OCR output looks like (read this before building the soil model)

The same soil data exists in three shapes, from rawest to ready-to-use. **A soil model should consume stage 3.**

| Stage | What it is | Where to get it | Exists when |
| --- | --- | --- | --- |
| 1. Reader output | what the OCR extracted, nothing decided yet | `record["soil"]` in `backend/storage/analyses/<id>.json` | right after the `reading_soil` step |
| 2. Review result | stage 1 + units, status, ranges, "please check" flags; this is what the website shows | `GET /api/analysis/{id}` → `soil` | right after the step (and after confirming, with the farmer's answers applied) |
| 3. **Model input** | the farmer-confirmed values in fixed units with provenance | `GET /api/analysis/{id}/soil/model-input` (also `record["soilModelInput"]`) | only after the farmer confirms the form (`409` before that) |

All numbers below are real output from the demo cards in `images_test/soil_cards/` (Hassan: clean; Kolar: smudged).

#### Stage 1: reader output (`record["soil"]`)

```json
{
  "readings": {
    "pH": { "value": 5.9,  "confidence": 1.0,   "region": [0.586, 0.4313, 0.0651, 0.0361], "reason": null },
    "EC": { "value": 1.86, "confidence": 0.999, "region": [0.5789, 0.4817, 0.083, 0.035],   "reason": null }
  },
  "labName": "District Soil Testing Laboratory, Hassan",
  "sampleDate": "2026-09-22",
  "engine": "rapidocr-pp-ocrv6",
  "pages": 1,
  "error": null
}
```

(Shortened to two of the six readings. `readings` has an entry for each parameter the report mentions. In Python this is
`SoilCardResult` / `SoilReading` in `ml/base.py`.) On the smudged Kolar card the same fields come back unfilled, with the
text location still known:

```json
"pH": { "value": null, "confidence": 0.866, "region": [0.5839, 0.4313, 0.068, 0.0376], "reason": "unreadable" }
```

| Field | Type | Meaning |
| --- | --- | --- |
| `readings.<key>.value` | number or `null` | value already converted to the app's unit (below). `null` = not filled in (see `reason`) |
| `readings.<key>.confidence` | 0-1 | OCR confidence of the number (`1.0` for a digital PDF's own text). It can be high while `value` is `null` (the text was seen but is not a usable number) |
| `readings.<key>.region` | `[x, y, w, h]` or `null` | box of the number on the card image, as fractions of its width/height |
| `readings.<key>.reason` | string or `null` | why it needs checking, see the reason codes below |
| `labName`, `sampleDate` | string / ISO date or `null` | read from the report; `null` when absent or unreadable |
| `engine`, `pages` | string, int | OCR engine used, pages read |
| `error` | object or `null` | set (with `code: "UNREADABLE_SOIL_CARD"`) when nothing usable was found; then `readings` is empty |

#### Stage 2: review result (`AnalysisResult.soil`)

One entry of `soil.values` (always all six, in the order pH, EC, OC, N, P, K; a parameter that was not found is
present with `value: null`):

```json
{ "key": "pH", "value": 5.9, "unit": "", "status": "deficient", "statusLabel": "Acidic",
  "range": { "low": 6.5, "high": 7.5 }, "confidence": 1.0,
  "needsReview": false, "reviewReason": null,
  "region": { "x": 0.586, "y": 0.4313, "w": 0.0651, "h": 0.0361 } }
```

A value the OCR could not read:

```json
{ "key": "pH", "value": null, "unit": "", "status": null, "statusLabel": null,
  "range": { "low": 6.5, "high": 7.5 }, "confidence": 0.866,
  "needsReview": true, "reviewReason": "unreadable", "region": { "x": 0.5839, "y": 0.4313, "w": 0.068, "h": 0.0376 } }
```

Around `values`: `{ "id", "farmId", "sampleDate", "labName", "cardImageUrl", "source": "ocr" | "manual", "confirmed": false }`.
Once the farmer confirms, their answers replace the OCR values here and `needsReview` is cleared for every field that
has a value.

#### Stage 3: model input (`GET /api/analysis/{id}/soil/model-input`)

A card that was read cleanly and confirmed unchanged:

```json
{
  "schemaVersion": 1,
  "analysisId": "an_d09807815b84409baf98261bc7bdfc9c",
  "farmId": "farm-1",
  "cropId": "tomato",
  "growthStage": "flowering",
  "sampleDate": "2026-09-22",
  "features": { "pH": 5.9, "EC": 1.86, "OC": 0.52, "N": 312.0, "P": 28.6, "K": 168.0 },
  "units":    { "pH": "", "EC": "dS/m", "OC": "%", "N": "kg/ha", "P": "kg/ha", "K": "kg/ha" },
  "status":   { "pH": "deficient", "EC": "excess", "OC": "sufficient", "N": "sufficient", "P": "excess", "K": "sufficient" },
  "provenance": {
    "pH": { "origin": "ocr", "confidence": 1.0 },   "EC": { "origin": "ocr", "confidence": 0.999 },
    "OC": { "origin": "ocr", "confidence": 0.998 }, "N":  { "origin": "ocr", "confidence": 0.996 },
    "P":  { "origin": "ocr", "confidence": 0.999 }, "K":  { "origin": "ocr", "confidence": 1.0 }
  },
  "complete": true,
  "source": "ocr",
  "ocrEngine": "rapidocr-pp-ocrv6",
  "confirmedAt": "2026-11-07T12:53:33+00:00"
}
```

A smudged card where the farmer typed pH, N and K and left the rest empty ("not on my report"):

```json
{
  "schemaVersion": 1, "analysisId": "an_…", "farmId": "farm-1", "cropId": "tomato", "growthStage": "flowering",
  "sampleDate": null,
  "features": { "pH": 6.4, "EC": null, "OC": null, "N": 230.0, "P": null, "K": 180.0 },
  "units":    { "pH": "", "EC": "dS/m", "OC": "%", "N": "kg/ha", "P": "kg/ha", "K": "kg/ha" },
  "status":   { "pH": "deficient", "EC": null, "OC": null, "N": "deficient", "P": null, "K": "sufficient" },
  "provenance": {
    "pH": { "origin": "farmer_edited", "confidence": null }, "EC": { "origin": "missing", "confidence": null },
    "OC": { "origin": "missing", "confidence": null },       "N":  { "origin": "farmer_edited", "confidence": null },
    "P":  { "origin": "missing", "confidence": null },       "K":  { "origin": "farmer_edited", "confidence": null }
  },
  "complete": false, "source": "manual", "ocrEngine": "rapidocr-pp-ocrv6", "confirmedAt": "2026-11-07T12:53:33+00:00"
}
```

| Field | Type | Meaning |
| --- | --- | --- |
| `schemaVersion` | int | `1`. Bumped if a field is renamed or its meaning changes; check it before reading |
| `analysisId`, `farmId`, `cropId`, `growthStage` | strings | context from the farmer's form. `cropId` is the crop the leaf photo was diagnosed as (e.g. `tomato`), or the crop the farmer picked if there was no leaf photo; `growthStage` is `vegetative` \| `flowering` \| `fruiting` |
| `sampleDate` | ISO date or `null` | date the soil was sampled, from the report. `null` when it was not readable; it is **never** filled with today's date |
| `features` | `{pH, EC, OC, N, P, K: number \| null}` | the confirmed values. **`null` = unknown; do not treat it as 0.** Always all six keys |
| `units` | strings | fixed: pH has none, EC dS/m, OC %, N/P/K kg/ha. Values are already converted, never the card's own unit |
| `status` | `"deficient"` \| `"sufficient"` \| `"excess"` \| `null` | the app's rule-of-thumb rating of each value against the table below (`null` when the value is). For pH, `deficient` means acidic and `excess` alkaline |
| `provenance.<key>.origin` | enum | `ocr` (read from the report, untouched), `farmer_edited` (OCR found something, the farmer changed it), `farmer_entered` (OCR found nothing, the farmer typed it), `missing` |
| `provenance.<key>.confidence` | 0-1 or `null` | OCR confidence; only set when `origin` is `ocr` |
| `complete` | bool | all six values present |
| `source` | `"ocr"` \| `"manual"` \| `"mixed"` | `ocr` = every value untouched OCR; `manual` = no OCR value used; `mixed` = both |
| `ocrEngine`, `confirmedAt` | string | which reader produced it, and when the farmer confirmed |

Parameters, units, accepted range and the rating thresholds used for `status` (all in `cropwise_api/soil.py`):

| Key | Unit | Accepted range | `deficient` below | `excess` above |
| --- | --- | --- | --- | --- |
| `pH` | none | 0 - 14 | 6.5 | 7.5 |
| `EC` | dS/m | 0 - 20 | (none) | 1.0 |
| `OC` | % | 0 - 5 | 0.5 | (never: above 0.75 is still `sufficient`) |
| `N` | kg/ha | 0 - 2000 | 280 | 560 |
| `P` | kg/ha | 0 - 500 | 10 | 25 |
| `K` | kg/ha | 0 - 3000 | 110 | 280 |

Using it from a model:

```python
import httpx

payload = httpx.get(f"http://127.0.0.1:8000/api/analysis/{analysis_id}/soil/model-input").json()
assert payload["schemaVersion"] == 1

ORDER = ["pH", "EC", "OC", "N", "P", "K"]               # fixed feature order
x = [payload["features"][k] for k in ORDER]             # floats, None where unknown
observed = [v is not None for v in x]                   # mask: impute or ignore the rest
trusted = [payload["provenance"][k]["origin"] != "missing" for k in ORDER]
```

Notes for the model:

- Expect gaps. Many reports lack EC or OC, and unreadable cards lose values, so the model needs a policy for
  `null` (mask, impute, or a model that tolerates missing inputs). `complete` tells you when there are none.
- `status` is a fixed rule of thumb, not ground truth; do not use it as a training label.
- `provenance` is optional signal. A value the farmer typed by hand and an OCR value at 0.55 confidence are not equally reliable.
- Values are not clipped to "typical" ranges: anything inside the accepted range above passes, including unusual ones
  (those were flagged for the farmer as `unusual_value`, then confirmed by them).
- Where to hook the model in: `confirm_soil` in `cropwise_api/routes.py`, right after `soil_rules.model_input(...)`
  builds and stores the payload. Nothing calls a soil model today.

#### Reason codes (`reason` / `reviewReason`)

Whether the value is left empty depends on the code. The website shows a message for each in English, Hindi and Kannada.

| Code | Meaning | `value` |
| --- | --- | --- |
| `not_found` | the parameter is not on the report | empty |
| `unreadable` | the number is there but smudged or cut off | empty |
| `low_confidence` | read with less than 0.50 confidence (`CROPWISE_OCR_FILL_MIN_CONFIDENCE`) | empty |
| `out_of_range` | the number read is impossible for that parameter (a misread digit) | empty |
| `unit_unclear` | printed in a unit that cannot be converted (e.g. N as %) | empty |
| `ambiguous` | the report shows two different values for it | filled (the more confident one) |
| `unit_converted` | converted from ppm, kg/acre, lb/acre or mg/100 g | filled |
| `unit_assumed` | no unit was printed, so the usual one was assumed | filled |
| `decimal_repaired` | a pH like `68` was read as 6.8 | filled |
| `digits_repaired` | letters such as `O` or `l` were read as digits | filled |
| `from_organic_matter` | organic carbon was derived from organic matter (÷ 1.724) | filled |
| `unusual_value` | possible but unusual for soil | filled |

Any filled value with a code, or with confidence below 0.75, shows as "please check" on the form. After the
farmer confirms, none of this is left on the values: the confirmed number is the answer.

### Known limits

- Labels must be printed in Latin script (English). Kannada/Hindi-only labels are not recognised by the bundled
  model; bilingual cards work because the English label is read. Devanagari/Kannada digits are converted if read.
- Only the six parameters the app uses are extracted (not S, Zn, Fe, B, Mn, Cu).
- Handwritten values are not supported. Multiple samples in one report: the first matching value is used and
  flagged `ambiguous` if the report repeats a parameter with a different value.
- Accuracy was measured on 26 synthetic reports covering different layouts, units, camera conditions and file types
  (all 153 fields correct, none silently wrong) plus the three demo cards. That is not a measure of accuracy on real
  field photos; the review form exists because real ones will be worse.

## Swapping or adding a model (ViT, OCR)

The API only knows the protocols in `cropwise_api/ml/base.py`:

- `LeafClassifier`: `info`, `labels` (`<crop>__leaf__<disease>`) and `predict(image) -> {label: probability}`.
- `SoilCardReader`: `read(bytes, mime) -> SoilCardResult` (raise `MlError("UNREADABLE_SOIL_CARD", …)` when unreadable). The built-in one is `ml/soil/reader.py` (`LocalSoilCardReader`); another OCR engine only needs to implement `OcrEngine` in `ml/soil/engine.py`.

To add the ViT: implement `LeafClassifier` (e.g. `ml/vit.py`), return it from `_build_vit` in `ml/registry.py`,
then start with `CROPWISE_LEAF_MODEL=vit` (and `CROPWISE_LEAF_CHECKPOINT=…`). No route, schema or website change.
If the OCR packages are missing (or `CROPWISE_SOIL_READER=unavailable`), `UnavailableSoilReader` takes over: cards are
stored, the analysis reports `UNREADABLE_SOIL_CARD`, and the website offers manual entry of N, P, K, pH, EC, OC.
`/health` shows which reader is active and why.

## Settings (environment variables)

| Variable | Default | Meaning |
| --- | --- | --- |
| `CROPWISE_LEAF_MODEL` | `cnn` | `cnn` or `vit` |
| `CROPWISE_LEAF_CHECKPOINT` | `ml/checkpoints/cnn/d053c9012200c857/best.pt` | weights file |
| `CROPWISE_DEVICE` | `cpu` | `cpu`, `auto` (cuda > xpu > cpu), or an explicit torch device |
| `CROPWISE_CONFIDENCE_THRESHOLD` | `0.70` | below this the UI asks the farmer to consult an expert |
| `CROPWISE_MIN_CROP_MASS` | `0.20` | below this share on the selected crop, diagnose as the crop the model sees |
| `CROPWISE_STORAGE_DIR` | `backend/storage` | uploads + analysis records |
| `CROPWISE_MAX_UPLOAD_BYTES` | 25 MB | per-file cap (the website shrinks photos before sending) |
| `CROPWISE_SOIL_READER` | `rapidocr` | `rapidocr` (local OCR) or `unavailable` (type values by hand) |
| `CROPWISE_OCR_MAX_PAGES` | `4` | pages of a PDF / multi-page scan that are read |
| `CROPWISE_OCR_FILL_MIN_CONFIDENCE` | `0.50` | below this a read value is left blank for the farmer |
| `CROPWISE_CORS_ORIGINS` | Vite dev/preview ports | only needed when the browser calls the API directly |
| `CROPWISE_PRELOAD_MODEL` | `1` | `0` loads the model on the first analysis instead of at startup |
| `CROPWISE_PORT` | `8000` | used by `start.sh` |

## Not built yet

- Accounts/OTP, farms, treatments and learning content are still mock.
- **Real advisory engine** (doses and protocols for all 105 classes, reviewed by an agronomist). Until then advice
  comes from the demo engine as described above.
- A soil model (the confirmed values are ready for it, see above), micronutrients, and non-English card labels.
- Translations of API text: diagnosis names are English (`contentLang: "en"`).
- Android app: the same code works once the app can reach the API (it needs the computer's LAN address
  as `VITE_API_BASE_URL` and the matching `CROPWISE_CORS_ORIGINS`); not wired or tested here.
- Job records live in memory, so a restart drops in-flight jobs. Finished analyses are stored on disk and survive.
- No automated backend tests yet; the flow was verified by hand against the real checkpoint.
