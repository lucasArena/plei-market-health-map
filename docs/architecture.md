# Architecture

## Layers

```
apps/
  web/                    Next.js 16: UI, Auth.js (Google SSO), React Query, Serwist PWA
    src/app/                Next's routing folder (pages, layouts, route handlers); thin
    src/application/        constants shared by the UI (Pleiful brand colors) and test/ helpers
    src/presentation/       screens (one per page), components (one folder each), hooks (React Query)
    src/infrastructure/     API client, the in-browser LLM, Auth.js, request locale
  server/                 HTTP API (Hono), mounted by web at /api/v1
    src/presentation/       Hono app and routes, auth guard, responses, sign-in tracking
    src/presentation/http/controllers/  one Hono controller per resource
    src/infrastructure/     repositories/ (Prisma, warehouse, sample) and providers/ (system, Linear), one folder per unit with its .types.ts and __tests__/
    src/container.ts        composition root, the only place that creates concrete adapters
    prisma/                 schema and migrations
packages/
  core/                   pure TypeScript, no framework
    src/domain/             entities, value rules (guard), DomainError, EntityId
    src/application/        services/, repositories/ and providers/ (interfaces), Zod DTOs, mappers, errors; fakes in testing/
    src/i18n/               typed en and pt-BR catalogs, getMessages, parseAcceptLanguage
  config/                 shared tsconfig presets and the Vitest factory (95% thresholds)
```

Dependencies point inward: `core/domain <- core/application <- apps/server <- apps/web`. Biome enforces it inside core (`noRestrictedImports` overrides in `biome.json`): domain imports nothing, application imports only domain, and core never imports the apps or a framework.

Server code is layered **controllers → services → repositories**, so the database behind a repository can change without touching the rest:

| Layer | Where | What it does |
| --- | --- | --- |
| Controllers | `apps/server/src/presentation/http/controllers/<resource>-controller.ts` | Hono handlers: read the request, call a service, respond |
| Services | `packages/core/src/application/services/` | Business logic (`makeListFacilities`, `makeGetMarketSummary`, …); never import a database or framework |
| Repository interfaces | `packages/core/src/application/repositories/` | What a service needs from storage (`FacilityRepository`, `LoginEventRepository`, …) |
| Provider interfaces | `packages/core/src/application/providers/` | Other outside needs: `Clock`, `IdGenerator`, `IssueTracker` |
| Repository implementations | `apps/server/src/infrastructure/repositories/{database,warehouse,sample}/` | Prisma, warehouse and sample implementations of the interfaces |
| Provider implementations | `apps/server/src/infrastructure/providers/{system,linear}/` | System clock and ids, the Linear issue tracker |
| Composition root | `apps/server/src/container.ts` | Picks which implementation each service gets, from the environment |

The server is **mounted, not deployed separately**. `apps/web/src/app/api/v1/[[...route]]/route.ts` hands every `/api/v1/*` request to `createApiApp({ resolveAccess })` from `@market-health-map/server`, and passes in how to read the Auth.js session. It's one Vercel project, one domain and one cookie. To split it out later, deploy `apps/server` on its own and point web at it; no code moves.

| Part | Responsibility | May import |
| --- | --- | --- |
| `core/domain` | Entities, value rules (`guard`), `DomainError` | nothing |
| `core/application` | Services, repository and provider interfaces, DTOs (Zod), mappers, errors, fakes | domain, zod |
| `core/i18n` | Message catalogs and locale detection | nothing |
| `apps/server` | Hono controllers, repository and provider implementations, composition root | core |
| `apps/web` | Next.js pages, components, Auth.js, React Query, PWA | core, server |

Packages ship raw TypeScript. Next transpiles them via `transpilePackages`, and Vitest resolves their aliases with `vite-tsconfig-paths`.

## Ports and adapters

| Port (application) | Adapter (infrastructure) | Fake (application/testing) |
| --- | --- | --- |
| `LoginEventRepository` | `PrismaLoginEventRepository` | `InMemoryLoginEventRepository` |
| `Clock` | `SystemClock` | `FixedClock` |
| `IdGenerator` | `UuidGenerator` | `SequentialIdGenerator` |
| `FacilityRepository` | `WarehouseFacilityRepository` (cached 5 min) when `DATA_WAREHOUSE_URL` is set, otherwise `SampleFacilityRepository` | `InMemoryFacilityRepository` |
| `FacilityStatsRepository` | `WarehouseFacilityStatsRepository` when `DATA_WAREHOUSE_URL` is set, otherwise `SampleFacilityStatsRepository` | `InMemoryFacilityStatsRepository` |

`apps/server/src/container.ts` is the composition root. It parses the environment (`apps/server/src/env.ts`, which fails fast), builds the Prisma client, and wires the use cases.

## Authentication

Auth.js (`next-auth` v5, `apps/web/src/infrastructure/auth/auth.ts`) with Google as the only provider and JWT sessions, so no auth database is needed.

- `/sign-in` is a single **Continue with Google** button. It's a server action (`signInWithGoogle`) that sends the user to Google with `hd=<domain>`.
- The `signIn` callback calls `evaluateSignIn` (`apps/web/src/infrastructure/auth/sign-in-policy.ts`). It accepts only verified emails on `ALLOWED_EMAIL_DOMAIN` (default `plei.com`), using the exact, case-insensitive `hasEmailDomain` from the domain package. Anyone else is sent back to `/sign-in?error=domain&email=…`, and the screen explains why.
- Defense in depth: `getInternalAccess()` re-checks the session's email on every request. The protected layout redirects `anonymous` users to `/sign-in` and `denied` ones to the error message, and the server's `requireUser(resolveAccess, request)` answers the API with 401 or 403, using the session check that web passes to `createApiApp`.
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
FacilitiesMapScreen (client)  ->  useFacilityListAll  ->  GET /api/v1/facilities
  -> listFacilities (use case)
    -> FacilityRepository.listAll  ->  SampleFacilityRepository (mock, infrastructure/src/sample)
```

The home page is only the map: a full-screen MapLibre GL map on the OpenFreeMap Positron basemap (free, no key, commercial use allowed), with one dot per facility. A layers control sits 20px from the top-left: a header chip with the Plei logo, “Market Health Map”, and a settings button, then a Facilities switch that fades markers in from below and fades them out downward. An App sessions switch sits next to Facilities and starts on. The heatmap runs from light cyan through electric blue to purple, and the sessions scale panel slides in from the left with the low, middle, and high counts for the current view. The market summary toggle and the account avatar (menu with sign-out) stay top-right. Single facilities are a 29px glass disc with the Plei logo fitted in the center and a 2px inset stroke. A facility with no played games in the current 28-day reporting period keeps that glass disc, uses a center 25% lighter than the brand green, and uses a white mark with a gray inset stroke. Clusters are a 41px glass disc with a 2px green stroke set 3px in from the edge and a near-black count. A cluster whose facilities are all inactive keeps the glass and uses a gray stroke with a darker gray count, both dark enough to read on the light map. The MapLibre circles underneath stay invisible so they can still receive hover, click, and the pointer cursor. When markers overlap, active ones stay on top: `toFacilityFeatureCollection` stable-sorts inactive facilities first, and both the dot layer (`circle-sort-key`) and the logo layer (`symbol-sort-key`) rank active facilities higher. MapLibre draws and hit-tests features in ascending sort-key order, and `queryRenderedFeatures` returns the topmost first, so the click and hover target is the same facility you see. Hovering a facility shows a card with its logo (colored initials until real logos exist) and name. Hovering a cluster lists up to 8 of its facilities, and clicking a cluster zooms in. Clicking an active cluster keeps zooming until one of its active facilities is drawn as its own dot. Clicking a single facility rings it, eases the map so the dot sits left of the panel, and slides in the facility detail panel from the right (see below). The × button or Escape slides it out; the selection clears when the slide-out animation ends. The paint and layout expressions are validated against the real MapLibre style spec in `FacilitiesMapScreenComponent.styles.test.ts`, because the MapLibre mock in the rules tests accepts anything. Zoom controls sit bottom-right (MapLibre `NavigationControl`, drawn as a `glass` pill by overrides in `globals.css`), and the OpenStreetMap credit (required by its license) is a small line bottom-left.

A search box sits at the top right, in the header row just left of the market summary toggle and the avatar (`MapSearch` in `presentation/components/map/`). The screen renders it through a portal into a slot in `AppHeader` (`HeaderSlotProvider`), so the search, the toggle and the avatar share one flex row with the header's 8px gap; it grows up to 24rem and shrinks on small screens, never overlapping the toggle or the layers control. It filters the already-loaded facility list on the client, with no extra request, and shows up to 8 markets (grouped by `marketId`, with a facility count) and up to 8 facilities (with their market name) whose names contain the query. Picking a market fits the map to its facilities (or eases to the only one, capped at zoom 11). Picking a facility eases to it at zoom 14 and opens its detail panel. Escape, or a click outside, closes the list. The field and the results list use the `glass-strong` surface, and the summary toggle and the avatar use `glass` (see `docs/design-system.md`). Every `FacilityPointView` carries `marketName`, read from `dim_region.region_name` in the warehouse ("Unassigned" when missing) and from the market name in the sample data; the domain falls back to the market id.

The facilities come from Plei's data warehouse (`dataplei.plei_gold`, documented in the `plei-data-catalog` repo). `WarehouseFacilityRepository` reads the endorsed `dim_location` table joined with `dim_region`: active locations (`deleted_at is null`) that have coordinates and where at least one game was ever posted (an `exists` on the endorsed `dim_reservation.location_id`, any reservation type or status: played, scheduled, cancelled or future). Locations with no reservations at all, such as schools or venues that were created but never used, are hidden. It also aggregates played pickup games from `dim_reservation` over the same four completed weeks used by the facility detail panel and exposes whether each facility had any activity. The connection is a small read-only `pg` pool (`default_transaction_read_only=on`, 20 s statement timeout), and `CachedFacilityRepository` keeps the result for 5 minutes. Rows are skipped when they are QA or test data (names with QA, TEST, dummy or fake, or internal regions such as L2M, Automation, Pipelines or Lucas), when the name has the word "ignore" in any case (`isIgnoredFacility`, a whole-word match on `\bignore\b`, so "IGNORE - Test Gym", "test ignore", "[Ignore] X" and "Phield House | IGNORE" are hidden, while "Signore Fitness", "Ignored" and "Pignoretti" stay visible), when their coordinates fall outside the Americas service area (one known bad row: `location_id` 27 at −84, 156), or when they fail domain validation. The remaining rows are then merged by `mergeColocatedFacilities`: records whose base name matches (everything before a ` | ` divider, compared case- and space-insensitively) and that sit within 50 m of each other become one marker. This folds sponsor or organizer twins such as "Phield House | Morby" or "X | Michelob ULTRA", and exact duplicates, into the base facility. The merged facility keeps the id and location of the record without a suffix (or the lowest `location_id`), is shown under the base name, lists every `memberIds`, and sums the members' metrics, so it is active when any member played in the last 28 days. The same base name at different spots stays as separate markers. Twins named differently from the base (for example "TOCA STL | Section 109" next to "TOCA St. Louis") are not merged. Only non-hidden catalog columns are read. Without `DATA_WAREHOUSE_URL`, the map falls back to deterministic mock facilities.

### Facility detail panel

```
FacilityDetailPanel (client)
  -> GET /api/v1/facilities/[facilityId]/reservations
    -> fast reservation scorecards, weekly activity and popular times
  -> GET /api/v1/facilities/[facilityId]/players
    -> unique and activated player scorecards, then the AI summary
```

The panel accepts any member id of a merged facility and requests stats for the whole group.
Both requests begin together, but the reservation response renders without waiting for player
analytics. Unique and activated player cards keep local skeletons until their response arrives, and
the AI summary starts only after both responses can be merged. Hovering a facility prefetches the
reservation response. `CachedFacilityStatsRepository` caches each slice independently for 5 minutes.

`WarehouseFacilityStatsRepository` runs separate parameterized queries for reservations and players.
The reservation query bounds its main scan to the previous 56 days through the next 7 days and
reads the last played date separately. The slower player query reads qualifying participation from
`fct_games_opened` for the same two 28-day periods. `toFacilityStatsView` can still merge both
slices for callers that need the complete detail. The panel shows four scorecards, a weekly activity
chart, and a popular-times heatmap; every chart point and heatmap cell is available by hover and
keyboard focus. The weekly activity chart shows the last four completed Monday to Sunday weeks
(the SQL buckets them from `date_trunc('week', current_date)` and leaves out the week in
progress). Each point is labeled by the Sunday that ends its week (`weekEndOf` in core), so
Mon Sep 21 to Sun Sep 27 shows as Sep 27. All copy lives in the `facilityDetail` i18n block.

### AI summary (in the browser)

`AiSummary` (`presentation/components/displays/AiSummary/`) rewrites the stats into a short summary with Llama 3.2 1B (`Llama-3.2-1B-Instruct-q4f16_1-MLC`), run by WebLLM on the viewer's GPU through WebGPU. Nothing is sent to a server, and there is no key, plan or cost. The same component runs in the facility detail panel and in the market summary drawer: each caller passes a context (the prompt and the cache key) built with `aiSummaryContextFor(subject, locale)`, where the subject is a facility, a market or all markets. The `BrowserLlm` class (`apps/web/src/infrastructure/ai/browser-llm/`) loads the engine once in a web worker (`browser-llm.worker.ts`), queues requests, and interrupts a stream when the panel switches facility. The first summary needs the viewer's consent, because the browser downloads about 880 MB from Hugging Face once and caches it. After that, summaries are generated automatically (about 3 s to load from cache and 3 s to write) and kept in `localStorage` per subject, week and locale by `AiSummaryCache` (`infrastructure/cache/local-storage/ai-summary/`), which drops the older week when a new one is written. The summary covers the last 28 days (the last 4 completed Monday–Sunday weeks): games played, confirmation rate, unique players, activated players, the change versus the previous 28 days, and the busiest day and time. `ActivitySummaryPrompt` (`infrastructure/ai/prompts/`) sends those facts (plus active facilities, and for all markets active markets, when summarizing a market scope) with the date range, a worked example in the viewer's language, and the language again in the last message. The 1B model embellishes and drifts into English without these. The template summary says the same thing. Where WebGPU is missing, or the model fails, the panel keeps the template summary. A finished summary is labeled "AI summary" with a sparkle icon. The slide animations are the `panel-slide-in` / `panel-slide-out` classes in `globals.css` and collapse to 1 ms under `prefers-reduced-motion`.

### Market summary

```
MarketSummaryToggle (header, next to the avatar)
  -> MarketSummaryPanel (mounted only while open)
    -> GET /api/v1/market-summary          scope, reservation scorecards, weekly activity,
                                           popular times, top markets and top facilities
    -> GET /api/v1/market-summary/players  unique and activated players
       (both take an optional ?market=<marketId>)
```

Only one side panel is open at a time. `SidePanelProvider` (in `AppProviders`) tracks which one is open, and each panel calls `useExclusiveSidePanel(id, isOpen, close)`, so opening a facility slides the market summary out and opening the market summary slides the facility panel out.

The panel-toggle button beside the avatar opens the same kind of floating panel as the facility detail view, aggregated across every visible facility and market. It is closed by default, and nothing is requested until it opens: the panel is only mounted while open, and both React Query entries use an infinite `staleTime` and `gcTime`, so the first open shows a skeleton and every reopen in the session is instant. Pressing the button again, the × button or Escape slides it out.

`makeGetMarketSummary` and `makeGetMarketPlayerStats` (core) read `FacilityRepository.listAll()`, so the summary follows exactly the same visibility rules as the map (only locations with a posted game, no QA/test, "ignore" or out-of-area rows, co-located twins merged). They pass every visible member id to the existing `FacilityStatsRepository` in one call, so each slice is still a single aggregated warehouse query (`location_id = any($1)`), cached for five minutes by `CachedFacilityStatsRepository`. The scope counts (active and total facilities and markets) and the top five markets and facilities by games played in the last 28 days come from the already-cached facility list, with no extra query. The panel reuses the detail view's scorecards (`StatTiles`), weekly activity chart and popular-times heatmap, plus a template sentence; there is no AI summary for the market view. All copy lives in the `marketSummary` i18n block (with shared labels from `facilityDetail`).

The panel follows the map search. `MapScopeProvider` (in `AppProviders`) holds the current scope: picking a market in `MapSearch` sets a market scope, picking a facility sets a facility scope, and clearing the search (the × button or an empty box) goes back to all markets. The panel title names the scope ("All markets", the market name, or the facility name) and changes while the panel is open. A market scope calls both endpoints with `?market=<marketId>`; the use cases aggregate only that market's visible facilities and answer 404 for a market with no visible facility and 400 for a blank value. The panel then drops the "Active markets" tile and the top markets list. A facility scope reuses the facility detail endpoints (`/facilities/:id/reservations` and `/players`, shared with the detail panel's cache) and hides the scope tiles and both rankings. Each scope has its own React Query entry, so switching back is instant, and nothing is fetched while the panel is closed.

## App metrics (project success tracking)

The project goal is that **at least 75% of the target users use the tool every week** (9 of the 11 in `TARGET_USER_EMAILS`). The **App metrics** page (`/metrics`, from the avatar menu) measures it. Only the people in `APP_METRICS_VIEWER_EMAILS` see the menu link; the page answers 404 and the API 403 for everyone else.

```
ActivityTracker (web, every signed-in page)  ->  POST /api/v1/activity   (activity-controller)
  -> recordDailyActivity (core service)  ->  DailyActivityRepository  ->  daily_activity (Neon)
AppMetricsScreen  ->  GET /api/v1/metrics, GET /api/v1/metrics/people?page=   (metrics-controller)
  -> getAppMetrics, listAppMetricsPeople  ->  CachedDailyActivityRepository (5 min)  ->  Prisma
```

- **Everyone is recorded; only target users count toward the goal.** The user always comes from the session, never from the request body.
- **One row per person per US Eastern day** in `daily_activity` (first and last seen, minutes, visits, and counters for facilities opened, market summaries, searches, AI summaries and feedback). This keeps the Neon free plan's compute low: the first visit of the day sends one request, remembered in `localStorage`; everything else is sent in one `sendBeacon` when the tab is hidden or closed. There are no periodic check-ins.
- A person is **active in a week** (Monday–Sunday, US Eastern) if they have at least one row that week. The page shows the weekly goal (green when ≥ 75%), active users, target users not active yet, an 8-week chart (`WeeklyActivityChart`) and a paginated people table (`DataTable` + `Pagination`), target users first.
- Reads are cached for 5 minutes on the server and in React Query, so viewing the page doesn't wake the database. Rows older than 180 days are deleted once a day.
- Without `DATABASE_URL`, activity is kept in memory (`MemoryDailyActivityRepository`), so local development works without a database.

## Feedback (Linear)

`POST /api/v1/feedback` turns the in-app "Help us improve" form into a Linear issue. It takes `multipart/form-data` and needs a signed-in Plei session like every other route (401 / 403).

| Field | Rules |
| --- | --- |
| `type` | `improvement` or `bug` (required) |
| `message` | Required, trimmed, at most 5000 characters |
| `images` | Repeat the field once per file: 0 to 5 files, `image/png`, `image/jpeg`, `image/webp` or `image/gif`, 10 MB each |
| `pageUrl`, `view` | Optional strings, at most 2048 characters |
| Whole request | At most 4 MB (`MAX_FEEDBACK_REQUEST_BYTES` in `packages/core/src/application/dtos/feedback-dto.ts`), below Vercel's 4.5 MB cap. The client compresses screenshots to stay under it |

It answers `201 { data: { identifier, url } }`. Errors use the usual envelope: `400 VALIDATION_ERROR` (with Zod `details`), `413 PAYLOAD_TOO_LARGE` when the request is over 4 MB, `502 ISSUE_TRACKER_FAILED` when Linear fails, and `503 FEEDBACK_NOT_CONFIGURED` when there are no Linear credentials.

`makeSubmitFeedback` (core) validates the form, uploads each screenshot one at a time through the `IssueTracker` port, and builds the issue. The title is "Bug Report from <name>" for bugs and "Feedback from <name>" for improvements, using the session name. It uses the email when there is no name, and just "Bug Report" or "Feedback" when there is neither. The markdown description holds the full message, the submitter's name and email from the session ("Submitted by"), the page and view, an ISO timestamp, and every screenshot inline as `![](assetUrl)`. `LinearIssueTracker` (`apps/server/src/infrastructure/providers/linear/`) calls Linear's GraphQL `fileUpload` mutation, PUTs the bytes to the signed `uploadUrl` with the returned headers plus `Content-Type` and `Cache-Control`, and then calls `issueCreate`. The team, Triage state, label and project IDs live in `DEFAULT_LINEAR_FEEDBACK_CONFIG` (`linear-feedback-config.ts`): improvements go to Requests, bugs go to Engineering with the `bug` label, and both land in the Market health map project.

`container.ts` picks the adapter from the environment:

| `FEEDBACK_DRY_RUN` | `LINEAR_CLIENT_ID` + `LINEAR_CLIENT_SECRET` | `LINEAR_API_KEY` | Result |
| --- | --- | --- | --- |
| `true` | any | any | `DryRunIssueTracker`: no network calls; logs the would-be `issueCreate` input and answers `201 { identifier: "DRY-n", url: "https://linear.app/dry-run/issue/DRY-n" }` |
| unset or `false` | both set | any | Real Linear issues created by the "Market Health Map" Linear app |
| unset or `false` | not both set | set | Real Linear issues created by the key's owner |
| unset or `false` | not both set | unset | `503 FEEDBACK_NOT_CONFIGURED` |

With app credentials, `LinearAppAuth` exchanges them for an app token (`POST https://api.linear.app/oauth/token`, `grant_type=client_credentials`, scope `read,write`), keeps it in memory until five minutes before it expires (tokens last about 30 days), and fetches a new one when Linear answers 401. Both the `fileUpload` and `issueCreate` calls send it as `Authorization: Bearer <token>`. Because the app is the actor, `issueCreate` also sends `createAsUser` (the submitter's name, or email) and `displayIconUrl` (their Google avatar, when the session has one), so Linear shows who submitted it. A personal key is sent without the `Bearer` prefix and without those two fields, which Linear only accepts from app tokens. Setting only one of the two app variables logs a warning and falls back to the key.

Dry-run wins over real credentials so local UI work never files real tickets. The credentials are server-only; never expose them with a `NEXT_PUBLIC_` prefix. The 4 MB limit is enforced three times: the route answers 413 from `Content-Length` before reading anything, it counts bytes while streaming the body (so a missing or understated header can't get around it), and the use case rejects screenshots that add up to more than the limit. The per-file 10 MB and five-image rules still apply.

## API conventions

- One Hono app (`apps/server/src/presentation/http/api-app.ts`) with base path `/api/v1`, one controller file per resource in `presentation/http/controllers/`, and one Next catch-all that mounts it.
- A middleware authenticates every request. Handlers stay thin: call the use case (Zod validates inside it) and respond. Unknown routes answer 404.
- Success returns `{ data, meta? }`. Errors return `{ error: { code, message, details? } }`, mapped in `apps/server/src/presentation/http/errors.ts` (the app's `onError`) with messages in the request's language.

## i18n and PWA

The locale comes from `Accept-Language` (`getRequestLocale`), falling back to `en`. The root layout passes the catalog to `MessagesProvider`.

Serwist builds `public/sw.js` from `src/app/sw.ts`, which precaches the build and falls back to `/~offline` for document requests. `src/app/manifest.ts` produces the web manifest.

Key insights prioritize period comparisons and scoped game contributions over scorecard recaps. The app's markets are warehouse regions: All markets names the largest market increases and declines by absolute games; a selected market names facility contributors, including opposing changes. Counts compare the same two completed 28-day periods, and a zero baseline has no percentage change. Contributor analytics load separately at `/api/v1/market-summary/insights`, after the main report; its loading or failure cannot block scorecards and charts. Browser AI generation stays in the child component and WebLLM worker, grounded in the computed contributor facts. Shared `KeyInsights` displays the sparkle icon, a plain overall-change introduction, contributor bullets, and 14px body text. Active-facility and active-market scope cards appear only in All markets. The available history does not establish statistical anomalies or seasonality.

The map layers control groups App sessions under Demand and independent Active facilities and Inactive facilities switches under Supply. All switches start enabled. Supply filtering uses the existing facility `isActive` value before clustering, so cluster counts and previews reflect visible facilities.
