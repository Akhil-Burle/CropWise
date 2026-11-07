# CropWise – Pesticide Usage Advisory & Organic Farming Awareness System

Frontend prototype for a VTU community/societal project (RV Institute of Technology and Management).
The planned ML study will train and evaluate **both a CNN and a Vision Transformer (ViT)** on the
same held-out images, retaining both models' results for college review. No winner is assumed.
See the [project synopsis](docs/SYNOPSIS.md) and [ML experiment plan](ml/README.md).
The initial EfficientNet-B0 CNN training script is implemented; training and measured model results are pending.
For the expanded crop scope, see the [fruit and vegetable dataset plan](docs/FRUIT_VEGETABLE_DATASETS.md)
and [source catalog](ml/data/dataset_catalog.csv), which distinguishes candidates from admitted data.
The selected sources have been curated into shared CNN/ViT training partitions. The dataset images
and prepared archive are **not stored in this GitHub repository**. See the
[dataset preparation report](docs/DATASET_PREPARATION_REPORT.md) for the release contents, counts,
exclusions and validation.

## Train the CNN from a fresh clone

The first run downloads the pinned public dataset archives from Mendeley Data and Hugging Face,
verifies them, prepares the training splits, installs dependencies and starts EfficientNet-B0:

```bash
git clone https://github.com/Akhil-Burle/CropWise.git
cd CropWise
python ml/run_cnn.py
```

Use Python 3.11 or newer. The initial setup needs an internet connection, about **8.5 GB of
downloads**, and roughly **35–40 GB of free disk space**. Later runs reuse the downloaded and
prepared data. PyTorch uses CUDA or Intel XPU when installed and available; otherwise training runs
on CPU and may take much longer. See the [CNN training guide](ml/src/models/cnn/README.md) for GPU setup
and options. No
model has been trained yet, so there are no measured results or checkpoints in the repository.

React 18 + Vite (JSX components, TypeScript services/types), Tailwind, React Router, Recharts (expert
screens only), Zustand, Zod, react-i18next, Capacitor for Android. No animation library. Runs fully
offline on mock data.

## Repo layout

```
cropwise/
  app/          React app – the website AND the Android app (Capacitor) from one codebase
    src/
      farmer/       simple farmer screens (home, check my crop, answer, sprays, plan)
      pages/        expert/agronomist screens + shared pages (learn, help, settings, auth)
      platform/     device layer: web vs Android (camera, storage, speech, notifications)
      services/     data layer: contracts, Zod schemas, mappers, http stubs, offline cache
      mock/         mock data + engine (all agronomic maths) – delete when the backend is live
      components/   design system (ui/) and shared feature components
      i18n/         locales (en, hi complete; kn covers every farmer screen; others via pipeline)
    android/      generated Android project
  tools/i18n/   full-sentence translation pipeline + glossary
  contracts/    openapi.json from FastAPI goes here
  backend/      FastAPI local ML API (uploads + analysis jobs → CNN) – see backend/README.md
  ml/           paired CNN and ViT study + separate soil-card OCR (planned)
    configs/    shared experiment specification
    data/       local datasets and shared split manifests
    src/        shared data/evaluation, separate models/cnn/, models/vit/ and ocr/
    checkpoints/ local trained weights (not committed)
    results/    comparison metrics, matched predictions and review figures
  docs/         project synopsis and design brief
```

## Setup

```bash
cd app
npm install
npm run dev        # website at http://localhost:5173 (all mock data, fully offline)
npm run dev:local  # same site, but leaf photo + soil card go to the local ML backend (see below)
npm run build
npm test           # vitest --run
npm run typecheck
```

## Android app

Needs Android Studio (SDK) and JDK 17+ on your machine.

```bash
cd app
npm run android:sync     # build web + copy into android/
npm run android:open     # open in Android Studio → Run on a phone
npm run android:apk      # debug APK: android/app/build/outputs/apk/debug/app-debug.apk
npm run android:release  # .aab for the Play Store (configure signing in Android Studio first)
```

Every change in `app/src` appears in both the website and the app after `android:sync`.
In the app: native camera, login token kept in native storage (log in once), Android text-to-speech,
real local notifications when a crop becomes safe to harvest, and an offline outbox.

## Two experiences, same data

The role returned at login decides the view.

- **Farmer** (default): home with one alert + 4 big buttons (Check my crop, My sprays, Learn, Call for
  help); "Check my crop" = stage picture + leaf photo (soil card optional, farm/crop remembered);
  answer screen = what's wrong (sure / likely / not sure), what to do today for *their* field
  (organic and chemical as equal choices, dose only after the safety promise), soil in plain sentences,
  "Remind me to spray". No charts, no animations, large text by default, read-aloud everywhere.
- **Agronomist / admin**: the full dashboard, wizard, OCR/diagnosis detail, transition charts, soil
  trends, analytics, rules library, farmer lookup (`/app/admin/farmers/:id`) with "send advice", and a
  review queue (`/app/admin/review`) of low-confidence / unconfirmed / partial checks. Advice appears on
  the farmer's home screen.

## Offline

- `services/offline.ts` caches farms, checks, advisories, sprays, guides and expert notes; a network
  failure shows the last saved copy.
- `hooks/useOutbox.ts`: a crop check taken with no network is kept on the phone and sent
  automatically when the network returns.

## Languages

11 languages in the picker (first launch, each in its own script). Language files load on demand.
English and Hindi are complete; Kannada covers every farmer screen (expert-only screens fall back to
English). Generate the rest with the pipeline:

```bash
BHASHINI_API_KEY=... node tools/i18n/translate.mjs translate --lang=ta,te,mr,bn,gu,pa,ml,or --provider=bhashini
# or --provider=indictrans2 (INDICTRANS2_URL) or --provider=google (GOOGLE_TRANSLATE_KEY)
node tools/i18n/translate.mjs review-export --lang=ta     # safety sentences → CSV for a native speaker
node tools/i18n/translate.mjs review-import --lang=ta --file=review-ta.csv
node tools/i18n/translate.mjs check                       # coverage + reviewed safety text
```

Placeholders such as `{{dose}}` and protected terms (product names, PHI…) are tokenised before
translation; a sentence that loses one is kept in English, so a translation can never change a dose.
`tools/i18n/glossary.json` maps terms to the local words farmers use. Farmers can tap
"Wrong translation?" on key screens.

## Running the demo

1. Pick a language → Login → "Continue as Ramesh Gowda · Farmer" for the farmer app, or
   "Dr. Kavya Shetty · Agronomist" for the expert app. OTP demo code: `123456`.
2. **Run full demo** (top bar) walks the whole pipeline with sample data.
3. Farmer: Home → Check my crop → choose stage → "Use sample leaf" → Get advice. (With `dev:local` there are no sample buttons: upload a real leaf photo.)
4. Expert: Review queue → Advise farmer → log in as the farmer to see the message on Home.
5. Settings → Demo tools: reset data, simulate session expiry.

## Design system overview

Tokens are CSS variables in `src/styles/index.css` (light/dark), mapped in `tailwind.config.js`.
Fraunces (display) + Noto Sans / Noto Sans Devanagari / Noto Sans Kannada (body), bundled offline.
Chemical = slate, organic = moss, equal weight. Toxicity colours (red/yellow/blue/green) appear only in
the toxicity band. 48px minimum targets, 3px focus ring, reduced-motion respected, A−/A+ text sizes.

## Running the website against the local ML backend

The leaf photo and soil card can go to the CNN on this machine (nothing is hosted). Start the API with
`backend/start.sh`, then `cd app && npm run dev:local`. Uploads, analysis and the crop list are real; accounts
and learning content stay mock, and advice follows the real diagnosis but uses the demo protocols (only 3
diseases have a spray dose; the rest get general organic guidance). Use real photos: the bundled sample
buttons are hidden in this mode. See [backend/README.md](backend/README.md).

## Connecting a real backend

Layering: **component → hook → service interface → adapter**. Components never import `src/mock` or
call fetch (checked with grep). The adapter is chosen once in `src/services/index.ts` from
`VITE_DATA_SOURCE` (`mock` | `local` | `http`; `local` = real uploads/analysis, mock for the rest, see `src/services/source.local.ts`). Base URL: `VITE_API_BASE_URL` (used only in `app/src/services/http`). For FastAPI, export
`openapi.json` into `contracts/` and run `npm run api:types` (see `contracts/README.md`).

To connect a backend, implement the methods in `src/services/http/index.ts` (each has a TODO). For each
method: call your API, then `decode(Schema, raw, mapper)` so malformed data becomes an
`INVALID_RESPONSE` error. If your API shape differs, change only `schemas/` and `mappers/`.
Every method must reject with `AppError` (`src/services/errors.ts`).

| Interface | Must return (types in `src/types`) |
| --- | --- |
| `AuthService` | `OtpChallenge` from requestOtp/register; `Session` from verifyOtp/refresh/loginAsDemo; `User \| null` from getCurrentUser. Token storage (cookie or bearer via `tokenStore`) is private to the adapter. Emit `sessionEvents.emitUnauthorized()` on 401 (done by `http/client.ts`). |
| `ProfileService` | `Profile`, `DataExport` |
| `FarmService` | `Paginated<Farm>`, `Farm`, `Crop[]`, `Region[]`, `SeasonTimelineItem[]` |
| `UploadService` | Built with `createUploadService(transport)` – supply a multipart or pre-signed-URL transport; resolves `UploadRef`, reports progress, supports abort. **Implemented** (multipart to the local API). |
| `AnalysisService` | `submit → {jobId}`, `getStatus → AnalysisJobStatus` (queued / processing(stage, progress) / completed(parts) / failed(error) / cancelled), `getResult/get/confirmSoil → AnalysisResult` (partial results via `soilError`/`diagnosisError`), `list → Paginated<AnalysisSummary>`. **Implemented** against the local API. |
| `SoilService` | `Paginated<SoilReport>`, `SoilReport \| null`, `SoilTrend`, `SoilComparison` |
| `AdvisoryService` | `DualAdvisory` with doses already computed for the requested area; `{saved}`; `AdvisoryReport` (`url` or `unavailable` → print fallback); `ShareMessage` |
| `TransitionService` | `TransitionPlan` (years, ROI, break-even, yield, SOC, seasons) for a speed; `SeasonTask` |
| `TreatmentService` | `Paginated<Treatment>` with status and harvest-safe date computed; `HarvestSafeResult`; `PhiAlert[]` |
| `LearnService` | `Paginated<ArticleSummary>`, `Article`, `GlossaryTerm[]`, `MythFact[]`, `QuizQuestion[]`, `QuizAnswerResult` |
| `ChatService` | `ChatMessage[]`, `ChatMessage`, `Helpline[]`, `ExpertNote[]`; `reportTranslation` |
| `WeatherService` | `WeatherReport` |
| `AdminService` | `Paginated<FarmerSummary>`, `AdminAnalytics`, `Paginated<RuleEntry>`, `FarmerDetail`, `Paginated<ReviewItem>`, `ExpertNote` (sendAdvice) |
| `DemoService` | Return empty lists / no-ops in production. |

Content methods receive `lang` and return `contentLang` (the language actually served). Lists accept
`page`, `pageSize`, `search`, `sort` and filters. All agronomic maths (dose per area, dilution, PHI,
ROI, SOC, transition shares) lives in the service; `src/mock/engine/` is deleted with the mock.
When `http` is complete, delete `app/src/mock/` and its import in `src/services/index.ts`.

## Tests

`app/src/test/services.test.jsx` renders a page against the mock services, swaps in a fake
`AnalysisService` with no component change, checks the uniform error state, checks Zod boundary
validation and checks dose scaling with acreage, and renders the farmer home (harvest alert + expert message).

> Demo data – not for real agricultural use. Always consult your local Krishi Vigyan Kendra or
> agriculture officer.
