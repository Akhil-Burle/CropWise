# backend/ (to be built)

Planned: FastAPI. The frontend does not depend on any endpoint path; it only needs each method of the
service interfaces in `app/src/services/contracts.ts` to be served somehow. Suggested shape:

- **Auth:** phone + OTP, returns the user with `roles` (`farmer` / `agronomist` / `admin`). Cookie or
  bearer token – the app supports both (`app/src/services/http/client.ts`).
- **Uploads:** pre-signed URL to object storage (S3/MinIO) or multipart. The app compresses images first.
- **Analysis jobs:** `submit` creates a job and returns `{jobId}` immediately; a worker (Celery/RQ)
  runs soil-card OCR and the leaf model; `status` returns
  `queued | processing(stage, progress) | completed(parts) | failed(error) | cancelled`.
  Stages the UI shows: `cleaning`, `reading_soil`, `analysing_leaf`, `matching_protocols`.
- **Advisory engine:** all maths server-side (dose per area, water, tank count, PHI, cost, ROI, SOC).
  Reference logic for every number lives in `app/src/mock/engine/` – port it, then delete `app/src/mock/`.
- **Content:** advisories, disease names, guides stored per language (`contentLang` in every response).
- **Expert:** farmer detail, review queue (low confidence / unconfirmed soil / partial), send advice.
- **Translations:** run `tools/i18n/translate.mjs` against stored content too, and keep a human-reviewed
  flag for safety text.
