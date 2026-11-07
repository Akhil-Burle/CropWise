# backend/ – local ML API

FastAPI service that carries the farmer's **leaf photo** and **soil card** from the website to the
ML models and returns the result. Everything runs on this machine: no hosted services, binds to
`127.0.0.1` only, files are stored under `backend/storage/` (git-ignored).

```
Browser ──/api──▶ Vite proxy ──▶ FastAPI (:8000) ──▶ job queue (1 worker) ──▶ LeafClassifier (CNN today, ViT later)
                                      │                                    └─▶ SoilCardReader (OCR – not built yet)
                                      └─ storage/uploads, storage/analyses
```

## Run it

```bash
# once: install the API dependencies into the ML virtualenv (it already has PyTorch)
ml/.venv/bin/python -m pip install -r backend/requirements.txt

# terminal 1 – API (loads the CNN checkpoint, then listens on 127.0.0.1:8000)
backend/start.sh

# terminal 2 – website talking to it
cd app && npm run dev:local        # http://localhost:5173
```

Check it: `curl localhost:8000/api/health` shows the loaded model, run id and device.
Interactive docs: http://127.0.0.1:8000/docs

## What the website does

`VITE_DATA_SOURCE=local` (the `dev:local` script) sends **uploads and analysis** to this API and keeps
everything else (login, farms, learning content) on mock data. See `app/src/services/source.local.ts`.
The browser always calls `/api/...`; the Vite dev/preview server forwards it to `http://127.0.0.1:8000`
(override with `CROPWISE_API_URL`), so there is no CORS.

In this mode:

- **Crop picker** lists every crop the loaded model can diagnose (`GET /crops`), not the 3 demo crops.
  If the API is unreachable it falls back to the demo list.
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
| `GET /uploads/{id}/file` | the stored image (previews) |
| `POST /analysis` | `AnalysisInput` → `{jobId}` (202) |
| `GET /analysis/jobs/{jobId}` | `queued` / `processing(stage, progress)` / `completed(parts)` / `failed(error)` / `cancelled` |
| `GET /analysis/jobs/{jobId}/result` | `AnalysisResult` |
| `POST /analysis/jobs/{jobId}/cancel` · `/retry` | cancel, or re-run with the same input |
| `GET /analysis` · `GET /analysis/{id}` · `DELETE /analysis/{id}` | history |
| `PUT /analysis/{id}/soil` | farmer-confirmed or manually typed soil values (range-checked) |

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

## Swapping or adding a model (ViT, OCR)

The API only knows the protocols in `cropwise_api/ml/base.py`:

- `LeafClassifier`: `info`, `labels` (`<crop>__leaf__<disease>`) and `predict(image) -> {label: probability}`.
- `SoilCardReader`: `read(bytes, mime) -> SoilCardResult` (raise `MlError("UNREADABLE_SOIL_CARD", …)` when unreadable).

To add the ViT: implement `LeafClassifier` (e.g. `ml/vit.py`), return it from `_build_vit` in `ml/registry.py`,
then start with `CROPWISE_LEAF_MODEL=vit` (and `CROPWISE_LEAF_CHECKPOINT=…`). No route, schema or website change.
Until the OCR exists, `UnavailableSoilReader` makes soil cards report `UNREADABLE_SOIL_CARD`, and the website
offers manual entry of N, P, K, pH, EC, OC.

## Settings (environment variables)

| Variable | Default | Meaning |
| --- | --- | --- |
| `CROPWISE_LEAF_MODEL` | `cnn` | `cnn` or `vit` |
| `CROPWISE_LEAF_CHECKPOINT` | `ml/checkpoints/cnn/d053c9012200c857/best.pt` | weights file |
| `CROPWISE_DEVICE` | `cpu` | `cpu`, `auto` (cuda > xpu > cpu), or an explicit torch device |
| `CROPWISE_CONFIDENCE_THRESHOLD` | `0.70` | below this the UI asks the farmer to consult an expert |
| `CROPWISE_MIN_CROP_MASS` | `0.20` | below this share on the selected crop, diagnose as the crop the model sees |
| `CROPWISE_STORAGE_DIR` | `backend/storage` | uploads + analysis records |
| `CROPWISE_MAX_UPLOAD_BYTES` | 10 MB | per-file cap |
| `CROPWISE_CORS_ORIGINS` | Vite dev/preview ports | only needed when the browser calls the API directly |
| `CROPWISE_PRELOAD_MODEL` | `1` | `0` loads the model on the first analysis instead of at startup |
| `CROPWISE_PORT` | `8000` | used by `start.sh` |

## Not built yet

- Accounts/OTP, farms, treatments and learning content are still mock.
- **Real advisory engine** (doses and protocols for all 105 classes, reviewed by an agronomist). Until then advice
  comes from the demo engine as described above.
- Soil card OCR (`ml/src/ocr`).
- Translations of API text: diagnosis names are English (`contentLang: "en"`).
- Android app: the same code works once the app can reach the API (it needs the computer's LAN address
  as `VITE_API_BASE_URL` and the matching `CROPWISE_CORS_ORIGINS`); not wired or tested here.
- Job records live in memory, so a restart drops in-flight jobs. Finished analyses are stored on disk and survive.
- No automated backend tests yet; the flow was verified by hand against the real checkpoint.
