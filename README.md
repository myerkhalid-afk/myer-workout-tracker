# Kinetic

A premium, iPhone-first, local-first fitness PWA for strength, cardio, recovery, body composition, coaching and partner progress.

## Current v1 status

Working now:

- onboarding and seeded Myer/Yusma profiles
- Today dashboard with readiness and exact daily prescription
- fast strength logger with previous values, 12-rep defaults, set types, RPE, notes, rest timer, exercise search and plate calculator
- cardio logger using Myer’s lab HR zones
- recovery check-in with an explainable readiness score
- progress analytics, PRs, body trends and training balance
- deterministic coaching and rest-day logic
- partner-preview feed, reactions, comments, shared streak and challenge
- IndexedDB persistence, offline service worker, backup export/import
- dark/light themes and installable PWA icons
- future Supabase migration with row-level security

Intentionally disabled in v1:

- live authentication, cross-device sync and real partner sharing, because no dedicated Supabase project slot is available
- direct Apple Health reads, because browser PWAs do not have full HealthKit access
- model-based AI coaching, so the base product remains free

## Run locally

```bash
npm install
npm run dev
```

Open the printed local URL. Kinetic seeds Myer’s real training context on first launch.

## Quality checks

```bash
npm run lint
npm test
npm run build
```

## Deploy to Vercel

No environment variables are required for local-only v1.

1. Import this repository into a **new** Vercel project named `kinetic` under `myerkhalid-afks-projects`.
2. Framework preset: Vite. Build command: `npm run build`. Output directory: `dist`.
3. Deploy. `vercel.json` provides the SPA rewrite and service-worker cache header.

Do not overwrite the existing `lift` or `claude-lift` projects.

## Install on iPhone

1. Open the deployed URL in Safari.
2. Tap Share.
3. Tap **Add to Home Screen**.
4. Launch Kinetic from the new icon. After the first load, the app shell works offline.

## Supabase later

Create a dedicated Supabase project, then apply:

```bash
supabase db push
```

The schema is in `supabase/migrations/202607100001_kinetic_schema.sql`. It includes normalized workout/cardio/recovery/body/social tables, HealthKit-import readiness and RLS policies. Add the project URL and anon key to a local `.env` based on `.env.example`, then implement the cloud adapter. Never put a service-role key in the browser.

## Repository upload after GitHub integration 403

The ChatGPT GitHub integration has read access but returned `403 Resource not accessible by integration` on the one write test. Upload the generated ZIP by opening the target repository on GitHub, choosing **Add file → Upload files**, dragging in the **contents of the unzipped folder** (not the ZIP itself), and committing to `main`.

## Data model notes

Weights are stored in kilograms internally and shown in familiar units in the logger. Myer’s HR zones are:

- Zone 1: below 143 bpm
- Zone 2: 143–158 bpm
- Zone 3: 158–177 bpm
- Zone 4: 177–185 bpm
- Zone 5: above 189 bpm

See `docs/ARCHITECTURE.md` for the local/cloud separation.
