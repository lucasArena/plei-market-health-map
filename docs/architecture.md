# Architecture

## Layers

| Package | Responsibility | May import |
| --- | --- | --- |
| `@market-health-map/domain` | Entities, value rules (`guard`), `DomainError` | nothing |
| `@market-health-map/application` | Use cases, ports, DTOs (Zod), mappers, errors, fakes | domain, zod |
| `@market-health-map/infrastructure` | Prisma repositories, record mappers, system adapters | application, domain |
| `@market-health-map/i18n` | Message catalogs and locale detection | nothing |
| `@market-health-map/web` | Next.js delivery: pages, API routes, Auth.js, React Query, PWA | everything |

Shared packages ship raw TypeScript. Next transpiles them via `transpilePackages`, and Vitest resolves their aliases with `vite-tsconfig-paths`.

## Ports and adapters

| Port (application) | Adapter (infrastructure) | Fake (application/testing) |
| --- | --- | --- |
| `LoginEventRepository` | `PrismaLoginEventRepository` | `InMemoryLoginEventRepository` |
| `Clock` | `SystemClock` | `FixedClock` |
| `IdGenerator` | `UuidGenerator` | `SequentialIdGenerator` |
| `FacilityRepository` | `WarehouseFacilityRepository` (cached 5 min) when `DATA_WAREHOUSE_URL` is set, otherwise `SampleFacilityRepository` | `InMemoryFacilityRepository` |
| `FacilityStatsRepository` | `WarehouseFacilityStatsRepository` when `DATA_WAREHOUSE_URL` is set, otherwise `SampleFacilityStatsRepository` | `InMemoryFacilityStatsRepository` |

`apps/web/src/server/container.ts` is the composition root. It parses the environment (`src/env.ts`, which fails fast), builds the Prisma client, and wires the use cases.

## Authentication

Auth.js (`next-auth` v5, `src/auth.ts`) with Google as the only provider and JWT sessions, so no auth database is needed.

- `/sign-in` is a single **Continue with Google** button. It's a server action (`signInWithGoogle`) that sends the user to Google with `hd=<domain>`.
- The `signIn` callback calls `evaluateSignIn` (`src/server/auth/sign-in-policy.ts`). It accepts only verified emails on `ALLOWED_EMAIL_DOMAIN` (default `plei.com`), using the exact, case-insensitive `hasEmailDomain` from the domain package. Anyone else is sent back to `/sign-in?error=domain&email=…`, and the screen explains why.
- Defense in depth: `getInternalAccess()` re-checks the session's email on every request. The protected layout redirects `anonymous` users to `/sign-in` and `denied` ones to the error message, and `requireUser()` answers the API with 401 or 403.
- `src/proxy.ts` sends signed-out page requests to `/sign-in`. `/sign-in`, `/api/*` (routes check auth themselves) and `/~offline` are public.
- The avatar menu (`UserMenu`) shows the Google photo, the email and **Sign out** (`signOutOfApp`).

## Login tracking (adoption monitoring)

```
Auth.js sign-in
  -> trackSignIn()                  Auth.js events.signIn (Google sub + email)
    -> recordLogin(use case)        one id per sign-in
      -> LoginEventRepository.save  upsert on login_events.session_id
```

One `login_events` row is written per successful sign-in: user id, session id, email, and first-seen time. `GET /api/v1/logins?limit=` returns the most recent rows. There is no screen for them yet.

## Facilities map

```
FacilitiesMap (client)  ->  useFacilities  ->  GET /api/v1/facilities
  -> listFacilities (use case)
    -> FacilityRepository.listAll  ->  SampleFacilityRepository (mock, infrastructure/src/sample)
```

The home page is only the map: a full-screen MapLibre GL map on the OpenFreeMap Positron basemap (free, no key, commercial use allowed), with one dot per facility. The Plei logo floats top-left and the account avatar (menu with sign-out) top-right; there is no header bar. Single facilities are drawn as the Plei logo badge (`plei-logo-marker.ts` rasterizes `/images/plei-logo.svg` into a map image) on a thin white ring, which is also the hover target. Hovering a facility shows a card with its logo (colored initials until real logos exist) and name. Hovering a cluster lists up to 8 of its facilities, and clicking a cluster zooms in. Clicking a single facility rings it, eases the map so the dot sits left of the panel, and slides in the facility detail panel from the right (see below). The × button or Escape slides it out; the selection clears when the slide-out animation ends. The paint and layout expressions are validated against the real MapLibre style spec in `FacilitiesMapComponent.styles.test.ts`, because the MapLibre mock in the rules tests accepts anything. Zoom controls sit bottom-right, and the OpenStreetMap credit (required by its license) is a small line bottom-left.

The facilities come from Plei's data warehouse (`dataplei.plei_gold`, documented in the `plei-data-catalog` repo). `WarehouseFacilityRepository` reads the endorsed `dim_location` table joined with `dim_region`: active locations (`deleted_at is null`) that have coordinates. The connection is a small read-only `pg` pool (`default_transaction_read_only=on`, 20 s statement timeout), and `CachedFacilityRepository` keeps the result for 5 minutes. Rows are skipped when they are QA or test data (names with QA, TEST, dummy or fake, or internal regions such as L2M, Automation, Pipelines or Lucas), when their coordinates fall outside the Americas service area (one known bad row: `location_id` 27 at −84, 156), or when they fail domain validation. Only non-hidden catalog columns are read. Without `DATA_WAREHOUSE_URL`, the map falls back to deterministic mock facilities.

### Facility detail panel

```
FacilityDetailPanel (client)  ->  useFacilityDetail  ->  GET /api/v1/facilities/[facilityId]
  -> getFacilityDetail (use case)
    -> FacilityRepository.listAll + FacilityStatsRepository.getWeeklyCounts
```

`WarehouseFacilityStatsRepository` runs one parameterized query on `plei_gold.dim_reservation`, following the catalog's rules: pickup games only (`reservation_type = 'OpenReservation'`), played means confirmed and not cancelled, cancellations for 'Recurring game series' and 'Operational changes' are excluded, and weeks are completed Monday–Sunday weeks on the local, timezone-naive `date_with_time`. It returns played games in the last 28 days, last week and the week before, scheduled and cancelled last week, upcoming games in the next 7 days, and the last played date. `toFacilityStatsView` adds the week-over-week change and the cancellation rate (null when the denominator is 0). The panel builds a template summary sentence and four stat tiles from these numbers in `FacilityDetailPanelComponent.rules.ts`; all copy lives in the `facilityDetail` i18n block.

### AI summary (in the browser)

`FacilityAiSummary` rewrites the stats into a short summary with Llama 3.2 1B (`Llama-3.2-1B-Instruct-q4f16_1-MLC`), run by WebLLM on the viewer's GPU through WebGPU. Nothing is sent to a server, and there is no key, plan or cost. `src/lib/ai/browser-llm.ts` loads the engine once in a web worker (`browser-llm.worker.ts`), queues requests, and interrupts a stream when the panel switches facility. The first summary needs the viewer's consent, because the browser downloads about 880 MB from Hugging Face once and caches it. After that, summaries are generated automatically (about 3 s to load from cache and 3 s to write) and cached in memory per facility, week and locale. The summary covers only one number: pickup games played in the last 28 days (the last 4 completed Monday–Sunday weeks, `played_last_28_days`). `facility-summary-prompt.ts` sends that count with the date range, a worked example in the viewer's language, and the language again in the last message. The 1B model embellishes and drifts into English without these. The template summary says the same thing. Where WebGPU is missing, or the model fails, the panel keeps the template summary. A finished summary is labeled "AI summary" with a sparkle icon. The slide animations are the `panel-slide-in` / `panel-slide-out` classes in `globals.css` and collapse to 1 ms under `prefers-reduced-motion`.

## API conventions

- Versioned routes under `app/api/v1`.
- Handlers stay thin: authenticate, validate (Zod inside the use case), call the use case, respond.
- Success returns `{ data, meta? }`. Errors return `{ error: { code, message, details? } }`, mapped in `src/server/api/errors.ts` with localized messages.

## i18n and PWA

The locale comes from `Accept-Language` (`getRequestLocale`), falling back to `en`. The root layout passes the catalog to `MessagesProvider`.

Serwist builds `public/sw.js` from `src/app/sw.ts`, which precaches the build and falls back to `/~offline` for document requests. `src/app/manifest.ts` produces the web manifest.
