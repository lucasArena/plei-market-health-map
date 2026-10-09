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
    src/i18n/               typed en, pt-BR and es catalogs, getMessages, parseAcceptLanguage
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

The home page is only the map: a full-screen MapLibre GL map on the OpenFreeMap Positron basemap (free, no key, commercial use allowed), with one dot per facility. The Market Health Map brand is a 32px glass pill at the top left. Search is centered in the header, and a 32px layers button sits just to its right. The layers menu opens with the same motion as search and stays right-aligned with that button. The layers menu is a Demand / Supply tree divided by a thin border; each section is a label with a visibility switch that shows or hides the nested dropdown below. App sessions and Active facilities start on; Inactive facilities starts off. The layers menu starts collapsed and remembers in `localStorage` whether it was left open (`layers-panel-preference.ts`). The layers button shows a small Plei-green dot in its top-right corner only while the settings differ from the defaults (a layer switched away from its default or a player filter applied), like Linear's display settings, and no dot with the defaults. While the settings differ, the bottom of the layers menu shows a footer with a thin top divider and a plain, right-aligned Reset text button, also modeled on Linear, that restores every layer and player filter to its default. It is not rendered with the defaults. The defaults and the comparison live in `MapLayersPanelComponent.defaults.ts` (`MAP_LAYERS_DEFAULTS` and `isMapLayersCustomized`), so the dot and the Reset button always agree. Hiding both facility groups fades the markers downward, and showing either group fades them back in from below. The heatmap runs from light cyan through electric blue to purple, and the sessions scale panel slides in from the left with the low, middle, and high counts for the current view. The market summary toggle stays top-right, and its panel opens 8px below the icon. The account menu stays the bottom-left control from staging. Zoom in and zoom out share one 32 by 64 glass capsule at the bottom right, inset with the rest of the map frame. Single facilities are a 29px glass disc with the Plei logo fitted in the center and a 2px inset stroke. A facility with no played games in the current 28-day reporting period keeps that glass disc, uses a center 25% lighter than the brand green, and uses a white mark with a gray inset stroke. Clusters are a 41px glass disc with a 2px green stroke set 3px in from the edge and a near-black count. A cluster whose facilities are all inactive keeps the glass and uses a gray stroke with a darker gray count, both dark enough to read on the light map. The MapLibre circles underneath stay invisible so they can still receive hover, click, and the pointer cursor. When markers overlap, active ones stay on top: `toFacilityFeatureCollection` stable-sorts inactive facilities first, and both the dot layer (`circle-sort-key`) and the logo layer (`symbol-sort-key`) rank active facilities higher. MapLibre draws and hit-tests features in ascending sort-key order, and `queryRenderedFeatures` returns the topmost first, so the click and hover target is the same facility you see. Hovering a facility shows a card with its logo (colored initials until real logos exist) and name. Hovering a cluster lists up to 8 of its facilities, and clicking a cluster zooms in. Clicking an active cluster keeps zooming until one of its active facilities is drawn as its own dot. Clicking a single facility rings it, eases the map so the dot sits left of the panel, and slides in the facility detail panel from the right (see below). The × button or Escape slides it out; the selection clears when the slide-out animation ends. The paint and layout expressions are validated against the real MapLibre style spec in `FacilitiesMapScreenComponent.styles.test.ts`, because the MapLibre mock in the rules tests accepts anything. Zoom controls sit bottom-right (MapLibre `NavigationControl`, drawn as a `glass` pill by overrides in `globals.css`), and there is no attribution line: it was removed because this is an internal tool (ENG-5802). OpenStreetMap's ODbL license asks for a visible credit wherever its data is shown, so add it back before showing the map outside Plei.
A search box sits centered in the header (`MapSearch` in `presentation/components/map/`). The screen renders it through a portal into a slot in `AppHeader` (`HeaderSlotProvider`). It grows up to 24rem and shrinks on small screens so it stays clear of the brand pill and the layers button. It filters the already-loaded facility list on the client, with no extra request, and shows up to 8 markets (grouped by `marketId`, with a facility count) and up to 8 facilities (with their market name) whose names contain the query. Picking a market fits the map to its facilities (or eases to the only one, capped at zoom 11). Picking a facility eases to it at zoom 14 and opens its detail panel. Escape, or a click outside, closes the list. Floating controls and panels share `--map-glass` at 65% opacity, `--map-shadow`, an 8px corner radius, and `--map-icon` (`#353E4B`). Every `FacilityPointView` carries `marketName`, read from `dim_region.region_name` in the warehouse ("Unassigned" when missing) and from the market name in the sample data; the domain falls back to the market id.

Facility and market scorecards use the rolling 7 or 28 full days ending yesterday and compare them with the immediately preceding 7 or 28 days. Today is never included, since its games are not confirmed until after the daily load. Weekly activity shows the four 7 day blocks ending yesterday.

Yesterday is relative to the viewer's local date. The browser sends its IANA zone as `?tz=` on every period request (`apps/web/src/infrastructure/time/stats-day.ts`). The server validates it (`resolveStatsTimeZone` in core, falling back to America/New_York), computes the local day once per request with the server clock (`statsToday`) and binds it as a date parameter (`$n::date`) into every warehouse query: facilities, reservation, player and game comparison stats, and the app-session heatmap. No query reads `current_date` or `now()` for these windows. `CachedFacilityRepository`, `CachedFacilityStatsRepository` and `CachedAppSessionHeatmapRepository` key entries by that date, and the React Query keys end with `statsDayKey()` (zone and local date), so two zones on different dates never share a cached result.

The facilities come from Plei's data warehouse (`dataplei.plei_gold`, documented in the `plei-data-catalog` repo). `WarehouseFacilityRepository` reads the endorsed `dim_location` table joined with `dim_region`: active locations (`deleted_at is null`) that have coordinates and where at least one game was ever posted (an `exists` on the endorsed `dim_reservation.location_id`, any reservation type or status: played, scheduled, cancelled or future). Locations with no reservations at all, such as schools or venues that were created but never used, are hidden. It also aggregates played pickup games from `dim_reservation` over the 28 completed calendar days ending yesterday and exposes whether each facility had any activity. The connection is a small read-only `pg` pool (`default_transaction_read_only=on`, 20 s statement timeout), and `CachedFacilityRepository` keeps the result for 5 minutes. Rows are skipped when they are QA or test data (names with QA, TEST, dummy or fake, or internal regions such as L2M, Automation, Pipelines or Lucas), when the name has the word "ignore" in any case (`isIgnoredFacility`, a whole-word match on `\bignore\b`, so "IGNORE - Test Gym", "test ignore", "[Ignore] X" and "Phield House | IGNORE" are hidden, while "Signore Fitness", "Ignored" and "Pignoretti" stay visible), when their coordinates fall outside the Americas service area (one known bad row: `location_id` 27 at −84, 156), or when they fail domain validation. The remaining rows are then merged by `mergeColocatedFacilities`: records whose base name matches (everything before a ` | ` divider, compared case- and space-insensitively) and that sit within 50 m of each other become one marker. This folds sponsor or organizer twins such as "Phield House | Morby" or "X | Michelob ULTRA", and exact duplicates, into the base facility. The merged facility keeps the id and location of the record without a suffix (or the lowest `location_id`), is shown under the base name, lists every `memberIds`, and sums the members' metrics, so it is active when any member played in the last 28 days. Its logo is the representative's, or the first member's that has one. The same base name at different spots stays as separate markers. Twins named differently from the base (for example "TOCA STL | Section 109" next to "TOCA St. Louis") are not merged. Only non-hidden catalog columns are read. Facility logos are the one exception to catalog-only reads: `dim_location.company_id` left-joins the unendorsed `plei_bronze.companies` (skipping deleted companies), and `companyLogoUrl` builds `https://pleiapp.s3.amazonaws.com/uploads/company/logo/{companies.id}/{companies.logo}` as the facility's `avatarUrl`. The file name is URL-encoded because S3 answers 403 for a raw `+`. The legacy `companies.logo_url` column is ignored. Facilities without a logo keep their initials. Without `DATA_WAREHOUSE_URL`, the map falls back to deterministic mock facilities.

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
`fct_games_opened` for the same two rolling 28-day periods. `toFacilityStatsView` can still merge both
slices for callers that need the complete detail. The panel shows four scorecards, a weekly activity
chart, and a popular-times heatmap; every chart point and heatmap cell is available by hover and
keyboard focus. Popular times use the mobile app's day parts in the game's local time
(`date_with_time` is already local wall-clock time, so it is never converted again): Morning
7am–12pm, Afternoon 12pm–5pm, Evening 5pm–10pm and Late night, shown as 10pm–2am but counting every
game from 10pm to 7am. In the heatmap only, games before 7am count toward the previous day's late
night (a 1am Saturday game appears under Friday); every other metric keeps the calendar day. Each period
label's tooltip shows its displayed range (`timePeriodRanges`); cell tooltips show only the game
count, while each cell's accessible label also names its day and period.
Scorecards, comparisons and popular times use rolling periods ending yesterday.
The weekly activity chart shows the four 7 day blocks ending yesterday
(the SQL buckets them with `generate_series(today - 28, today - 7, interval '7 days')`, so the
last block equals 7D and the four add up to 28D). Each point is labeled by the last day of its
block (`weekEndOf` in core, start plus 6 days), so Oct 1 to Oct 7 shows as Oct 7. All copy lives in the `facilityDetail` i18n block.

### AI summary (in the browser)

`AiSummary` (`presentation/components/displays/AiSummary/`) rewrites the stats into a short summary with Llama 3.2 1B (`Llama-3.2-1B-Instruct-q4f16_1-MLC`), run by WebLLM on the viewer's GPU through WebGPU. Nothing is sent to a server, and there is no key, plan or cost. The same component runs in the facility detail panel and in the market summary drawer: each caller passes a context (the prompt and the cache key) built with `aiSummaryContextFor(subject, locale)`, where the subject is a facility, a market or all markets. The `BrowserLlm` class (`apps/web/src/infrastructure/ai/browser-llm/`) loads the engine once in a web worker (`browser-llm.worker.ts`), queues requests, and interrupts a stream when the panel switches facility. The first summary needs the viewer's consent, because the browser downloads about 880 MB from Hugging Face once and caches it. After that, summaries are generated automatically (about 3 s to load from cache and 3 s to write) and kept in `localStorage` per subject, reporting-period end date and locale by `AiSummaryCache` (`infrastructure/cache/local-storage/ai-summary/`), which drops the older period when a new one is written. The summary covers the selected period, the 7 or 28 full days ending yesterday: games played, confirmation rate, unique players, activated players, the change versus the previous 7 or 28 days, and the busiest day and time. `ActivitySummaryPrompt` (`infrastructure/ai/prompts/`) sends those facts (plus active facilities, and for all markets active markets, when summarizing a market scope) with the exact rolling date range, a worked example in the viewer's language, and the language again in the last message. The 1B model embellishes and drifts into English without these. Until the AI text arrives (checking, waiting for consent, downloading, or before the first streamed words) the box shows the "Key insights" heading over a pulsing skeleton, never the template. Where WebGPU is missing, or the model fails, it shows the template summary instead. The text area has a fixed height (`h-44`), so streaming never moves the panel; when the text is longer, a fade and a "Show more" / "Show less" button let you expand it, and a new subject collapses it again. A finished summary is labeled "AI summary" with a sparkle icon. The slide animations are the `panel-slide-in` / `panel-slide-out` classes in `globals.css` and collapse to 1 ms under `prefers-reduced-motion`.

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

`makeGetMarketSummary` and `makeGetMarketPlayerStats` (core) read `FacilityRepository.listAll()`, so the summary follows exactly the same visibility rules as the map (only locations with a posted game, no QA/test, "ignore" or out-of-area rows, co-located twins merged). They pass every visible member id to the existing `FacilityStatsRepository` in one call, so each slice is still a single aggregated warehouse query (`location_id = any($1)`), cached by `CachedFacilityStatsRepository` for five minutes, except player stats, which cover completed days only and are kept for an hour. The player query compares `confirmed_game`, `valid_player`, `open_reservation_games` and `players_type` through `+ 0` / `|| ''` on purpose: those columns are indexed but each matches about half of `fct_games_opened`, and letting Postgres combine their indexes cost seconds, so it narrows by date and location only. The scope counts (active and total facilities and markets) and the top five markets and facilities by games played in the last 28 days come from the already-cached facility list, with no extra query. The panel reuses the detail view's scorecards (`StatTiles`), weekly activity chart and popular-times heatmap, plus a template sentence; there is no AI summary for the market view. All copy lives in the `marketSummary` i18n block (with shared labels from `facilityDetail`).

`/market-summary` and `/market-summary/insights` also take an optional `departments=magic,organizers` filter (`gameDepartmentsSchema`). No departments, or all three, means every game, so the default response and its cache entries stay exactly as before. With a filter, the scope counts, rankings and insights read the per department windows already on the cached facility list (insights then skip the comparison query), and the reservation stats run `FACILITY_RESERVATION_STATS_BY_DEPARTMENT_SQL`, which sorts games with the same `game-department-sql` rule the map counts use and is cached per department set. `/market-summary/players` takes the same filter. With departments it runs `FACILITY_PLAYER_STATS_BY_DEPARTMENT_SQL`: the reservations at the same locations and dates are sorted with the same `game-department-sql` rule (by the `dim_reservation` partner, as the map does) and only `fct_games_opened` rows for the selected departments' reservations count. Unique players then played at least one such game in the window; activated players had their first ever game in the window and it was such a game. No departments, or all three, runs the unfiltered player query unchanged, and `CachedFacilityStatsRepository` keeps one player entry per scope, department set and viewer's day. The filtered query takes about 2 s for Magic across all markets (about 0.9 s unfiltered) and about 0.5 s for Organizers or Partnerships.

`/market-summary` and `/market-summary/insights` also take an optional `departments=magic,organizers` filter (`gameDepartmentsSchema`). No departments, or all three, means every game, so the default response and its cache entries stay exactly as before. With a filter, the scope counts, rankings and insights read the per department windows already on the cached facility list (insights then skip the comparison query), and the reservation stats run `FACILITY_RESERVATION_STATS_BY_DEPARTMENT_SQL`, which sorts games with the same `game-department-sql` rule the map counts use and is cached per department set. `/market-summary/players` takes no filter: player counts come from `fct_games_opened`, which the department rule does not cover.

The panel follows the map search. `MapScopeProvider` (in `AppProviders`) holds the current scope: picking a market in `MapSearch` sets a market scope, picking a facility sets a facility scope, and clearing the search (the × button or an empty box) goes back to all markets. The panel title names the scope ("All markets", the market name, or the facility name) and changes while the panel is open. A market scope calls both endpoints with `?market=<marketId>`; the use cases aggregate only that market's visible facilities and answer 404 for a market with no visible facility and 400 for a blank value. The panel then drops the "Active markets" tile and the top markets list. A facility scope reuses the facility detail endpoints (`/facilities/:id/reservations` and `/players`, shared with the detail panel's cache) and hides the scope tiles and both rankings. Each scope has its own React Query entry, so switching back is instant, and nothing is fetched while the panel is closed.

## Feature flags

Flags turn a feature on or off for everyone without a deploy. The keys live in code (`FEATURE_FLAG_KEYS` in core), and the `feature_flags` table (Neon) only stores each key's state, who switched it and when. A key with no row is off, and rows for keys that are no longer in code are ignored.

```
web useFeatureFlag(key)  ->  GET /api/v1/feature-flags             -> { enabled: [...] }   (any signed-in user)
/admin/feature-flags     ->  GET /api/v1/feature-flags/all         -> every flag in code    (admins only)
                         ->  PUT /api/v1/feature-flags/:key        { enabled }              (admins only)
  -> feature-flags-controller -> listEnabledFeatureFlags / listFeatureFlags / setFeatureFlag (core)
  -> CachedFeatureFlagRepository (30 s, cleared on every switch) -> PrismaFeatureFlagRepository
```

Admins are the people in `ADMIN_EMAILS`. The avatar menu shows them one **Admin controls** link that opens `/admin/metrics`; it and `/admin/feature-flags` share the `AdminTabs` bar to switch between them (`/admin` redirects to metrics, and the old `/metrics` and `/feature-flags` URLs redirect permanently from `next.config.ts`). The pages answer 404 for anyone else, and their APIs answer 403 (`require-admin.ts`). Each server instance caches the flags for 30 seconds and each browser refetches them after 30 seconds, so a switch reaches everyone within about a minute. How agents add and remove flags is in `AGENTS.md` → *Feature flags*.

## App metrics (project success tracking)

The project goal is that **at least 75% of the target users use the tool every week** (9 of the 11 in `TARGET_USER_EMAILS`). The **App metrics** page (`/admin/metrics`, from Admin controls in the avatar menu) measures it. Only the people in `ADMIN_EMAILS` see the menu link; the page answers 404 and the API 403 for everyone else.

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
| `pageUrl`, `view`, `appVersion` | Optional strings, at most 2048 characters. The web client sends the version it is running (`getAppVersion()`, the same value as the account hub footer) |
| Whole request | At most 4 MB (`MAX_FEEDBACK_REQUEST_BYTES` in `packages/core/src/application/dtos/feedback-dto.ts`), below Vercel's 4.5 MB cap. The client compresses screenshots to stay under it |

It answers `201 { data: { identifier, url } }`. Errors use the usual envelope: `400 VALIDATION_ERROR` (with Zod `details`), `413 PAYLOAD_TOO_LARGE` when the request is over 4 MB, `502 ISSUE_TRACKER_FAILED` when Linear fails, and `503 FEEDBACK_NOT_CONFIGURED` when there are no Linear credentials.

`makeSubmitFeedback` (core) validates the form, uploads each screenshot one at a time through the `IssueTracker` port, and builds the issue. The title is "Bug Report from <name>" for bugs and "Feedback from <name>" for improvements, using the session name. It uses the email when there is no name, and just "Bug Report" or "Feedback" when there is neither. The request body holds the full message, the submitter's name and email from the session ("Submitted by"), the page, view and app version, an ISO timestamp, and every screenshot inline as `![](assetUrl)`. Bug reports send it as the issue description; improvement issues leave the description empty and carry the body in their customer request. `LinearIssueTracker` (`apps/server/src/infrastructure/providers/linear/`) calls Linear's GraphQL `fileUpload` mutation, PUTs the bytes to the signed `uploadUrl` with the returned headers plus `Content-Type` and `Cache-Control`, and calls `issueCreate`. Improvements then link the body to the returned issue identifier with `customerNeedCreate`; bugs do not create customer requests. The team, Triage state, label and project IDs live in `DEFAULT_LINEAR_FEEDBACK_CONFIG` (`linear-feedback-config.ts`): improvements go to Requests, bugs go to Engineering with the `bug` label, and both land in the Market health map project.

`container.ts` picks the adapter from the environment:

| `FEEDBACK_DRY_RUN` | `LINEAR_CLIENT_ID` + `LINEAR_CLIENT_SECRET` | `LINEAR_API_KEY` | Result |
| --- | --- | --- | --- |
| `true` | any | any | `DryRunIssueTracker`: no network calls; logs the would-be `issueCreate` input and, for improvements, the `customerNeedCreate` input, then answers `201 { identifier: "DRY-n", url: "https://linear.app/dry-run/issue/DRY-n" }` |
| unset or `false` | both set | any | Real Linear issues created by the "Market Health Map" Linear app |
| unset or `false` | not both set | set | Real Linear issues created by the key's owner |
| unset or `false` | not both set | unset | `503 FEEDBACK_NOT_CONFIGURED` |

With app credentials, `LinearAppAuth` exchanges them for an app token (`POST https://api.linear.app/oauth/token`, `grant_type=client_credentials`, scope `read,write,customer:write`; without `customer:write` Linear rejects `customerNeedCreate`), keeps it in memory until five minutes before it expires (tokens last about 30 days), and fetches a new one when Linear answers 401. The `fileUpload`, `issueCreate`, and improvement-only `customerNeedCreate` calls send it as `Authorization: Bearer <token>`. Because the app is the actor, creation mutations also send `createAsUser` (the submitter's name, or email) and `displayIconUrl` (their Google avatar, when the session has one), so Linear shows who submitted the issue and request. A personal key is sent without the `Bearer` prefix and without those two fields, which Linear only accepts from app tokens. Setting only one of the two app variables logs a warning and falls back to the key.

Dry-run wins over real credentials so local UI work never files real tickets. The credentials are server-only; never expose them with a `NEXT_PUBLIC_` prefix. The 4 MB limit is enforced three times: the route answers 413 from `Content-Length` before reading anything, it counts bytes while streaming the body (so a missing or understated header can't get around it), and the use case rejects screenshots that add up to more than the limit. The per-file 10 MB and five-image rules still apply.

## API conventions

- One Hono app (`apps/server/src/presentation/http/api-app.ts`) with base path `/api/v1`, one controller file per resource in `presentation/http/controllers/`, and one Next catch-all that mounts it.
- A middleware authenticates every request. Handlers stay thin: call the use case (Zod validates inside it) and respond. Unknown routes answer 404.
- Success returns `{ data, meta? }`. Errors return `{ error: { code, message, details? } }`, mapped in `apps/server/src/presentation/http/errors.ts` (the app's `onError`) with messages in the request's language.

## i18n and PWA

The locale comes from `Accept-Language` (`getRequestLocale`): English (`en`), Brazilian Portuguese (`pt-BR`) or Spanish (`es`, for any `es-*` browser), falling back to `en`. The root layout passes the catalog to `MessagesProvider`.

Serwist builds `public/sw.js` from `src/app/sw.ts`, which precaches the build and falls back to `/~offline` for document requests. `src/app/manifest.ts` produces the web manifest.

Key insights prioritize period comparisons and scoped game contributions over scorecard recaps. The app's markets are warehouse regions: All markets names the largest market increases and declines by absolute games; a selected market names facility contributors, including opposing changes. Counts compare the rolling 28 completed days ending yesterday with the 28 completed days immediately before them, and a zero baseline has no percentage change. Contributor analytics load separately at `/api/v1/market-summary/insights`, after the main report; its loading or failure cannot block scorecards and charts. Browser AI generation stays in the child component and WebLLM worker, grounded in the computed contributor facts. Shared `KeyInsights` displays the sparkle icon, a plain overall-change introduction, contributor bullets, and 14px body text. Active-facility and active-market scope cards appear only in All markets. The available history does not establish statistical anomalies or seasonality.

The map layers menu is a Demand / Supply tree divided by a thin border. Each section is a label with a visibility switch; turning the switch on reveals the nested content below that row. Behind `player-demographic-filters`, Demand shows App sessions and User registrations as radio options, then the Add filter tree. Behind `facility-games-layer`, Supply shows Games and Facilities as radio options, then the Department Add filter tree, then Show trend (when `facility-games-trend` is on) or Show inactive facilities. App sessions and Active facilities start enabled; Inactive facilities starts disabled. Supply filtering uses the existing facility `isActive` value before clustering, so cluster counts and previews reflect visible facilities.

### App session demographic filters

Enable `player-demographic-filters` in Admin controls → Feature flags to expose Player filters under App sessions. The flag starts off. Gender and skill options are the distinct nonempty stored `dim_player.gender` and `dim_player.skill_description` values for accounts with activity in the same 28 completed days. They load independently of session aggregates. Age filtering uses optional inclusive minimum and maximum whole-year bounds from 0 through 120. Either bound can be left blank. This is a current-profile filter, not age or profile at session time. Each field defaults to All; selected values within gender or skill combine with OR, and separate fields combine with AND. Missing profile values remain included for unrestricted fields and are excluded when that field is selected. No additional account eligibility or game participation restriction is introduced.

`AppSessionFilters` shows applied choices as removable chips under App sessions. Add filter stays under that row and is hidden while App sessions is off. Gender, Player skill level, and Player age open in place. Player age takes an optional inclusive minimum and maximum from 0 through 120. Apply filter is a 5% black button with a black label at the bottom of the layers panel once a choice is selected, commits it, and closes the panel. Empty results, loading, and failures for an applied cohort appear in the session reference panel. Keyboard arrows, Home, End and Escape operate the lists, with focus restored to the trigger. Hiding App sessions disables editing, pauses requests and retains applied filters. Disabling the feature flag clears the cohort. The map legend displays the applied cohort and loading/failure states, and clears stale data and scale values while another cohort loads.
`appSessionFiltersSchema` validates the HTTP query and service boundary. `WarehouseAppSessionHeatmapRepository` adds a parameterized `EXISTS` on `dim_player.player_id` before the existing coordinate aggregation, so profile joins cannot multiply daily session counts. Only aggregate cells and distinct profile labels reach the client. `CachedAppSessionHeatmapRepository` uses a canonical key per cohort, shares concurrent requests, retries failed queries, expires after an hour, and bounds the cohort cache to 100 entries. Choices use a separate hourly cache. An hour is safe because the heatmap only covers completed days, and it matters because `players_behaviour` (7.4M rows) has no indexes, so every miss is a full scan of about 3–5 s; React Query also caches each cohort for five minutes and does not fetch while App sessions is hidden. The fixture has no demographic metadata and therefore offers no profile options and returns no filtered cells.

The existing geographic source uses the player's most recent coordinates. The catalog marks those coordinates unsuitable for standard regional reporting; this change preserves the existing heatmap and does not establish session-time locations. Live query latency and historical location correctness remain unverified.

The app-session heatmap endpoint accepts optional `metric=registrations` behind the demographic demand selector. Its repository counts distinct confirmed app accounts by region for the last 28 completed days, joining one median facility coordinate per region. Profile predicates remain bound parameters. Metric and demographic cohort both participate in the heatmap cache key. Missing geographic coverage is omitted; the UI explains the market-level placement.

Registration rendering uses a stronger heatmap intensity and wider radius for isolated market points. Its legend uses individual visible market counts, rather than summing nearby markets into session viewport areas. Switching back restores the session paint settings.

Local UI feature flags default to enabled under `NODE_ENV=development`. The override is in `useFeatureFlag` and never persists flag values; production builds, including staging deployments, use saved settings.
`facility-games-layer` gates a Supply selector for Facilities or Games (last 28 completed days). Facility map DTOs include `gamesLast28Days` from existing facility metrics, including merged co-located totals. MapLibre clusters sum that field into `gameCount`; Games mode displays that total on clusters and each facility’s count in its glass badge. Badges remain pointer-transparent, preserving facility hover and detail-click handlers. Facilities exposes an optional Show inactive facilities sub-filter, off by default. Games hides this sub-filter and excludes all facilities with zero games; Games is the default and Reset restores Games; flag-off keeps facility logo badges. Counts of 1,000 or more use compact notation with at most one decimal place (for example, 1.4K).

The Supply Department multi-select is shared by Games and Facilities under `facility-games-layer`. No selection includes all departments; multiple choices are ORed. Warehouse game counts classify Magic first by partner IDs 6, 52, 62, then Organizers by distinct partners with a current non-deleted Organizer Program term in `fct_terms`, and remaining games as Partnerships. Each facility DTO includes disjoint department totals; co-located facilities sum them. Selected departments determine game badge totals and the matching venues in Facilities mode over the same 28 completed days. Switching metrics preserves selections, and Reset clears them. Organizer membership is current-state, not reconstructed historical membership. Facility detail/hover data retains its existing unfiltered behavior. The summary panel follows the same filter in All markets and a selected market (`useMarketSummaryFilters`, read only while `facility-games-layer` is on): scorecards, weekly activity, popular times, key insights, active facility and market counts, rankings, unique and activated players and the AI summary count only the selected departments' games, and the selection is part of the summary, insights and players query keys and the AI summary cache key. With a filter, unique players are players with at least one selected-department game in the window, and activated players are players whose first ever game (the one `fct_games_opened` row marked `Activated`) was a selected-department game in the window, so per department activations add up to the total. A facility scope and the other Layers settings (show inactive facilities, Games or Active facilities, demographics, Sessions or Registrations) leave the panel unchanged. There is no filtered badge in the panel.

`facility-games-trend` gates the games trend: the Show trend switch under Games and everything it drives (trend rings and tips, hover changes, the detail panel trend). It requires `facility-games-layer` (`FEATURE_FLAG_REQUIREMENTS` in `feature-flags-dto.ts`), so it takes effect only while both are on: `GET /api/v1/feature-flags` lists it only then, and the Feature flags page notes the requirement and shows "On, waiting for facility-games-layer" while games is off. `listFacilities` reads the flags in effect and leaves `gamesLast28Days` and the department totals out of `/api/v1/facilities` while games is off, and the previous window (`gamesPrevious28Days`, `gamesPreviousByDepartment`) while the trend is off. Under `next dev` the server treats every flag as on, matching `useFeatureFlag`. Both flags start off like any new flag, so an admin turns on `facility-games-layer` and then `facility-games-trend`.

Supply filters share Demand’s Add filter flow and styling: choose Department, edit a removable chip, stage multi-select options and Apply. Reset clears the chip and applied selection.

Demand and Supply filter selections are displayed in their chips only; the redundant applied/all-population summary lines are omitted. Pending changes, Apply and data status messages remain.

Reset is available only in the Layers panel footer. Added filter chips make the footer Reset available even before Apply; it clears both Demand and Supply draft/applied filters.

Games trend classification treats any transition from zero to games as growth and any drop to zero from games as decline. Zero-current locations remain in trend mode when they had games in the previous window, using the declining marker and matching hover/detail classification.

Games trend direction follows every count change without percentage or minimum-game thresholds: any increase is green/up, any decrease is red/down, and exactly equal counts are gray/rightward. Hover text reports the count difference.

The games trend window is defined once by `GAMES_WINDOW_DAYS` in the domain. Warehouse date bounds use that length and twice that length for adjacent completed windows; hover, detail and flag-description copy interpolate the same value. Regression tests substitute 7 days. Existing `gamesLast28Days`/`gamesPrevious28Days` DTO names and SQL aliases are legacy contracts, not window configuration. A future per-user selector must pass its selected window through the API/query/cache and the copy formatters together; changing only the text would mislabel the data. Facility and market detail statistics have independent fixed 28-day contracts.

The 7D | 28D switch drives the Games layer too. Facility map DTOs also carry `gamesLastWeek` and `gamesLastWeekByDepartment` (the 7 full days ending yesterday, sent with games) and `gamesPreviousWeek` and `gamesPreviousWeekByDepartment` (the 7 days before, sent with the trend), read in the same warehouse pass and summed for co-located facilities. On 7D, `facilitiesForPeriod` copies the weekly windows into the `gamesLast28Days`/`gamesPrevious28Days` fields the map, clusters, department filter and trend already read, just as it swaps `isActiveLastWeek` into `isActive`; hover trend copy then reads "7 days" (`trendWindowDays`). Switching periods needs no refetch.

Metric drill-down (`metric-drill-down`, off by default) adds a glass bar-chart control between the period switch and summary toggle. It shares the exclusive right drawer slot. Measure / Slice / Segment (one row) explore Games played, Active facilities, Scheduled games, Confirmation rate, Unique players, Activated players, Almost-filled rate and Incident games % through `GET /api/v1/metric-drill-down`, using the applied map department filters and Supply visibility. Games, scheduled games, confirmation rate and both player measures can group by Market, Facility or Department, with optional disjoint department segments for Market/Facility; Active facilities use activity in the selected window without segments. Confirmation rate is played / scheduled and stays unavailable when scheduled is 0. Unique and activated players count each person once per group and once in the total. Almost-filled rate follows the data catalog: among eligible canceled pickup games (`status = 'cancelled'` and `coalesce(cancellation_reason, 'Not enough players')` not Recurring game series or Operational changes), the share whose `dim_reservation.min_player_count` minus `fct_payouts.real_player_count` is 1 to 3. A canceled game with no payout row, more than one, or a null `real_player_count` is a data error: it is left out of the rate (never counted as 0) and the drawer shows the count in red. Incident games % counts distinct happened games with at least one `dim_review.rate < 3` review (several low reviews on one game count once) and divides them by all happened games, including unreviewed ones. It carries a note that recent days can still grow as reviews arrive. Every rate shows its numerator and denominator under the headline, in each table row and in bar tooltips. Both quality rates share one warehouse query (`metricDrillDownQualitySql`). Scheduled and player measures reuse the facility-panel reservation and player SQL. A small Date range pill (`MapMetricSelect` `variant="pill"`) sits in the drawer header beside a matching circular expand button; both use a light frosted glass (`SOFT_GLASS_CLASS`) that stays secondary to the top navigation, and the date dropdown uses the full glass surface. The pill and offers 7D, 28D, 90D, 6M and 12M (default follows the map’s 7D or 28D). Windows end yesterday in the viewer’s time zone. The server groups in SQL (with colocated merge), caches by measure, range, grain, scope, departments and time zone, and supports count, distinct-count and rate measure kinds so later measures can share the endpoint. Missing data stays unavailable; warehouse failures surface as errors. The chart shows the top ten; the sortable table includes all groups. Bar and row clicks toggle a group filter for both the chart/table and Supply markers. A compact map icon requests camera movement through MapScopeProvider without changing metric scope or opening details. Scope changes reset local navigation; period changes and closing the drawer preserve valid controls. English, Portuguese and Spanish UI text is included.

The metric drill-down drawer uses the summary drawer’s `map-glass` surface and shared slide-in/slide-out animation, including reduced-motion support. Its expand control widens the panel and increases chart height without changing metric selections or scope. It has no close button: the bar chart toggle in the header closes it, and Escape collapses the expanded view first, then closes the drawer and returns focus to the toggle. Charts use vertical bars, stacked department segments, dotted horizontal gridlines, right-hand value labels, and exact-value hover/focus labels; the complete sortable table remains below.

Applied department filters narrow drill-down totals, grouping and segments for the selected period. Active facilities remain counted once using activity flags, restricted to facilities with games in a selected department; missing department data stays unavailable. Changing department filters clears the selected group. Demand demographic filters only affect session data. The selector menus reuse filter glass surfaces, row spacing, checkmarks, hover colors and keyboard navigation. Selector help uses one native tooltip on the trigger; chart values use one custom tooltip for hover and keyboard focus without a native duplicate.


Metric bar and table-name clicks filter results to that group; clicking the selected group again restores the complete chart and table. A selected department segment narrows counts, bars, columns and map Supply to that department. Selection does not move the camera. Row actions are compact map icons with accessible labels and a single native tooltip; they issue metric-focus navigation to zoom to matching facility coordinates, retaining the drawer and metric controls. Textual Explore facilities/View on map actions have been removed. Count sort uses an inline, non-wrapping label and arrow in both drawer widths. Demand keeps its independent filters.

Metric drill-down table rows toggle selection across their full width, with Enter/Space keyboard support and a soft background tint. The map icon stops propagation so zooming does not toggle selection. Bar selection uses a subtle brightness change rather than a box outline; labels remain unobstructed.

App activity drill-down (ENG-6069, behind `metric-drill-down`) offers App sessions, Registrations and Unique users for Market and Date. Sessions sum `players_behaviour.q_sessions`; unique users count distinct session players with positive activity, with an independently computed distinct total. Activity maps to `dim_player.region_id` without adding account eligibility filters to session users; unmatched profiles appear as Unassigned. Facility scope resolves to its market. Department filters and Supply visibility do not restrict app measures. Registrations use distinct confirmed `pleiapp_player` accounts and share market-coordinate eligibility and date predicates with the registrations heatmap, which now follows 7D/28D. Session/user ranges including both June 29 and June 30, 2026 show the tracking source switch note (Mixpanel + UXCam through June 29, Firebase afterward). Sample app activity remains unavailable rather than inventing counts. The app-activity SQL helper can be reused by the Users section (ENG-6060).


Time drill-down (ENG-6070, behind `metric-drill-down`) adds Date to Slice with an arrow opening an adjacent Day / Week / Month submenu on hover. Hover preserves keyboard focus and does not change the selection; moving to another Slice option dismisses the submenu. Click and keyboard entry remain available. The selected Slice reads Date · Day/Week/Month; no separate bucket control is rendered. The submenu supports Right to enter, Left or Escape to return, and arrow/Home/End navigation. Ranges retain their rolling start but exclude the current calendar bucket; weeks start Monday and months start on the first. Weekly bar, table, tooltip and selection labels show the Sunday week-ending date; monthly labels show only the localized abbreviated month and year (for example, Sep 2026). The first bucket is marked partial when the range starts within it. Totals cover the displayed dates. Counts reconcile to bucket sums; players, users, registrations and active facilities are distinct within each bucket and independently over the displayed range, so their buckets need not add to the distinct total. Rates retain numerator, denominator and roster errors per bucket and department. SQL grouping sets read each population once and calculate bucket, segment and range totals independently. Empty count buckets are zero; rates with zero denominators are unavailable. Co-located venues count once per active-facility bucket. Bucket selection filters the chart/table and Supply to returned facility IDs without moving the camera; app activity retains its independent scope. Every time bucket is shown chronologically in a horizontally scrollable chart, including daily 6M/12M ranges. Sessions and unique users mark June 29, 2026 on the timeline when visible and retain the source-switch note. Sample time data is unavailable rather than estimated from rolling totals. The shared operational-cancellation predicate coalesces its Boolean result to false, keeping eligible canceled games with null reasons in scheduled denominators.

Drill-down loading preserves the Measure, Slice and Segment controls, with wrapped values instead of truncation. Muted animated skeletons reserve headline, date, chart and table space until results arrive, with reduced-motion support and an accessible loading status. All three field dropdowns share the same trigger and glass menu styling.

Drill-down field menus align below their controls with the compact 12rem minimum width. The chart reserves space above its highest tick and a wider numeric axis gutter. Table sorting uses a small directional chevron for the active column, with inactive indicators revealed on hover or keyboard focus; column headers retain accessible sort state.


Drill-down previous-period comparisons (ENG-6071, behind `metric-drill-down`) are always shown for Market, Facility and Department, and hidden for Date. The service queries equal-length windows through the same repository, preserving scope, department filters and distinct totals; 6M is 180 days and 12M is 365 days. Each row carries its own previous value and department values. Prior-only groups remain visible with zero current counts. Counts and distinct counts show percent changes, rates show percentage-point changes, both to one decimal; arrow direction follows any raw increase/decrease (counts reuse `classifyGamesTrend`). Zero prior counts show New, missing values remain unavailable. Change sorting puts New and unavailable last in both directions. Selecting a department segment uses that segment’s prior value. App sessions and Unique users show the tracking-source note when either window spans the June 29/30 switch. Both windows use the existing repository cache with their reference dates; sample historical comparisons remain unavailable.

Comparison labels use an arrow and percentage followed by the signed raw count difference (without repeating up/down), or “Stable (+0)” for equal values. Declining arrows and percentages use the same #EF4444 red as the trend down icon; raw differences stay in normal foreground text. Non-time count groups with zero in both windows are omitted from the chart and table; real new activity and declines to zero remain visible.

The Compare pill sits beside Date range in the drawer header and shows WoW, MoM or YoY in both the trigger and dropdown; hover tooltips retain the full Year over year, Month over month and Week over week names. The headline and table show the percentage first followed by the signed raw count difference in parentheses (↑ 8% (+12), ↓ 25% (-3)). Only the arrow and percentage use the trend color; the raw difference uses normal foreground text. New activity shows ↑ New (+4). Rates keep percentage-point differences, stable values show “Stable (+0)” without an arrow, and Change sorting still uses percentage differences. Comparison selection stays independent of the table’s Change sort. It keeps the selected range length and shifts its ending day back by seven days, one calendar month or one calendar year, clamping month ends and leap days to the last valid day. The default is Week over week for 7D and Month over month otherwise; later range changes preserve the chosen comparison. Time grouping hides the selector. The comparison travels through the API and React Query key; the legacy omitted parameter still compares the immediately preceding equal-length window. Change headers and values use normal font weight.

Stable changes show plain “Stable (+0)” text with no arrow, in both the headline and table.
