# CropWise – Design Brief

**Product:** Pesticide Usage Advisory & Organic Farming Awareness System
**Project:** VTU community/societal project, RV Institute of Technology and Management

## Personality

An agronomist's field notebook that behaves like a clean fintech dashboard. Calm, factual and
trustworthy. It treats chemical and organic options as two equal, honest choices (harm reduction,
not propaganda). Safety information is never hidden or styled as decoration.

Two audiences shape every decision:

| Farmer (mobile, sunlight, patchy network)        | Agronomist / extension worker (desktop)       |
| ------------------------------------------------- | --------------------------------------------- |
| Bottom navigation, 48px+ targets, big numbers     | Sidebar, dense tables, charts, compare views  |
| Icon **and** text on every critical action        | Keyboard-first, filters, pagination           |
| Plain-language copy, read-aloud, A-/A+ text size  | Confidence scores, ranges, rule library       |

## Palette

Paper and soil, with one warm accent. Colours are CSS variables (RGB triplets) so light/dark
themes swap without touching components.

| Token            | Light     | Dark      | Use                                     |
| ---------------- | --------- | --------- | --------------------------------------- |
| `bg` (paper)     | `#F6F2E9` | `#0F1612` | App background                          |
| `surface`        | `#FFFDF8` | `#17211B` | Cards                                   |
| `surface-2`      | `#EFE9DC` | `#1F2B24` | Insets, table headers                   |
| `ink`            | `#1D261F` | `#ECE7DB` | Body text (AA on all surfaces)          |
| `ink-muted`      | `#56605A` | `#A9B1A9` | Secondary text (AA on surface)          |
| `line`           | `#DDD5C4` | `#2E3B33` | Borders                                 |
| `forest`         | `#1F4D33` | `#7FC79A` | Brand, primary buttons, focus ring      |
| `forest-deep`    | `#14301F` | `#0B1A11` | Sidebar, hero                           |
| `clay`           | `#A8541F` | `#E39A62` | Warm accent, highlights                 |
| `ochre`          | `#C98B1C` | `#E2B04A` | Charts, timeline, badges                |
| `chem` (slate)   | `#35506B` | `#93B4D6` | Chemical protocol identity              |
| `organic` (moss) | `#4A6E24` | `#A9CF79` | Organic & IPM protocol identity         |

**Strictly semantic colours (never reused for decoration):**

| Meaning                    | Hex       |
| -------------------------- | --------- |
| Toxicity – Extremely toxic | `#C62828` (red)    |
| Toxicity – Highly toxic    | `#F2C200` (yellow) |
| Toxicity – Moderately toxic| `#1565C0` (blue)   |
| Toxicity – Slightly toxic  | `#2E7D32` (green)  |
| Soil – Deficient           | `#B4660E` |
| Soil – Sufficient          | `#2F7D4A` |
| Soil – Excess              | `#B3261E` |

Chemical (slate) and organic (moss) are equal in saturation and weight so neither column looks
"better". Toxicity colours appear only inside the toxicity band/triangle.

## Typography

- **Display:** Fraunces Variable (soft optical-size serif, notebook character). Headings only.
- **Body/UI:** Noto Sans Variable, with Noto Sans Devanagari and Noto Sans Kannada as fallbacks so
  Hindi and Kannada render in the same family. Numbers use `tabular-nums`.
- All fonts are bundled through `@fontsource` packages, so the demo works offline.
- Scale (rem, root = 16px, user-adjustable 87.5% / 100% / 112.5% / 125%):
  12 · 14 · 16 · 18 · 20 · 24 · 30 · 36 · 48. Body line-height 1.6; Indic scripts get 1.75.

## Tokens

- **Spacing:** 4px base (Tailwind scale). Page gutters 16px mobile / 32px desktop. Card padding 20–24px.
- **Radius:** `sm 8px` (chips), `md 12px` (inputs, buttons), `lg 16px` (cards), `xl 24px` (hero panels).
- **Shadow:** `card` = 0 1px 2px rgba(29,38,31,.06), 0 4px 16px rgba(29,38,31,.05);
  `pop` = 0 12px 40px rgba(20,48,31,.18). Dark mode uses borders instead of shadows.
- **Touch targets:** min 48×48px for every interactive element.
- **Focus:** 3px `forest` ring with 2px offset on every focusable element (`:focus-visible`).

## Motion

- Short and functional: 150–250ms ease-out for UI, 400ms for page and step transitions.
- Motion explains state (stepper progress, processing stages, gauges filling). No decorative loops.
- `prefers-reduced-motion` (and Framer Motion's `MotionConfig reducedMotion="user"`) turns
  transitions into simple fades.

## Site map

```
/                      Landing
/login /register /verify   Auth (phone OTP, demo users)
/app                   Dashboard
  /analysis/new        New Analysis wizard (crop → soil card → leaf → review)
  /analysis/job/:jobId Processing (polls job status)
  /analysis/:id/soil   OCR Review
  /analysis/:id/diagnosis  Diagnosis result
  /analysis/:id/advisory   Dual Advisory (hero)
  /transition          Organic Transition Hub
  /tracker             Treatment Tracker / Calendar
  /soil                Soil Health History
  /farms               My Farms
  /reports             Reports / History
  /learn, /learn/:id   Learn Hub, article/guide
  /help                Helpline & Expert Connect
  /settings            Settings / Profile
  /admin, /admin/farmers, /admin/rules   Agronomist/Admin (role-guarded)
*                      404
```

**Navigation:** desktop sidebar (grouped: Work · Plan · Learn · Admin); mobile bottom bar with five
items (Home, Analyse, Tracker, Learn, More) and a "More" sheet for the rest. A top bar holds farm
context, language switcher, theme toggle and the "Run full demo" button (mock data source only).
