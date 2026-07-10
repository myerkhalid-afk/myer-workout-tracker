# Kinetic architecture

## Runtime layers

1. **UI and domain layer** — React pages, logger components, analytics and deterministic coaching rules.
2. **Local repository** — a single versioned `KineticState` document persisted in IndexedDB through Dexie. This is the source of truth in v1 and works offline.
3. **Cloud adapter** — an interface in `src/services/cloud.ts`. The current adapter is intentionally disabled. A later Supabase adapter can push/pull normalized records without changing the UI.
4. **Native health bridge** — the data model records source identifiers and measurement types needed by a future Capacitor/native iOS wrapper. The PWA does not claim direct HealthKit access.

## Offline behavior

The Vite PWA service worker precaches the application shell and all route chunks. User data is never placed in the service-worker cache; it remains in IndexedDB. JSON export/import is the portable backup path.

## Coaching engine

`src/coach/rules.ts` is deterministic and testable. It computes readiness from sleep, soreness, stress, energy, mood, RHR and HRV; calculates training balance; evaluates recent strength/cardio load; and produces an exact daily prescription. Rules can later become tools used by an AI coach rather than being discarded.

## Cloud security

The migration under `supabase/migrations` enables RLS on every user-data table. Private recovery, body and HealthKit-import data are owner-only. Workouts/cardio can be shared only with accepted connections and only when the activity visibility is `connections`.
