# Market Health Map: agent guide

An internal Plei tool that shows market health across supply, player activity, facilities, organizers, game quality, and technology incidents. It lives in its own repo, separate from PleiOS and the Plei app, so its releases never block theirs.

Must-haves (from the Linear project): SSO login, tracking which internal users log in and when (adoption), and documenting how agents were used. That record is the Linear ticket every piece of agent work gets (see *Linear tracking* in `AGENTS.md`) plus the PR description; there is no log file in the repo.

## Architecture

pnpm + Turborepo monorepo with clean architecture, split into three parts: `apps/web`, `apps/server` and `packages/core`.

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

The server is **mounted, not deployed separately**. `apps/web/src/app/api/v1/[[...route]]/route.ts` hands every `/api/v1/*` request to `createApiApp({ resolveAccess })` from `@market-health-map/server`, and passes in how to read the Auth.js session. It's one Vercel project, one domain and one cookie. To split it out later, deploy `apps/server` on its own and point web at it; no code moves.

Pleiful brand colors are documented in `docs/design-system.md`. TypeScript consumers use
`@/application/constants/brand-colors`; Tailwind and CSS consumers use the matching `pleiful-*` theme colors.

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

See `docs/architecture.md` for more depth.

## Conventions (non-negotiable)

- **No comments in code.** Names and tests carry the meaning.
- **All `interface`/`type` declarations live in `*.types.ts` files** and are imported where they're used.
- **No nested ternaries.** For more than one condition, use the computed-key object pattern (`{ [`${a}`]: x, [`${b}`]: y }.true`), with low-priority keys first.
- **Path aliases only.** No relative imports. Web uses `@/*`, server uses `@server/*`, and core uses `@core/*`. Across packages, import `@market-health-map/core/domain`, `@market-health-map/core/application`, `@market-health-map/core/i18n` or `@market-health-map/server`. Every consumer's `tsconfig.paths` must list every alias it loads transitively.
- Every page in `src/app` only renders its screen from `src/presentation/screens/<Name>Screen/` (e.g. `FacilitiesMapScreen`). Screens compose the reusable pieces in `src/presentation/components/`.
- One folder per React component: `Name/NameComponent.tsx` plus `.types.ts` and `.rules.ts` siblings, and its tests in `__tests__/`. The `.rules.ts` hook holds all the logic, and the component only renders.
- Named exports only. Default exports are allowed only for Next.js pages, layouts, and `manifest`.
- Validate every boundary with Zod. No user-facing string is hardcoded; it comes from `@market-health-map/core/i18n`.
- Tests live in a `__tests__/` folder beside the code they cover, as `__tests__/<name>.test.ts(x)`. Inside `src/app`, Next skips `_`-prefixed folders, so `__tests__` never becomes a route. Coverage must be ≥ 95% in every package. Services are tested with in-memory fakes, never DB mocks.
- Biome for lint and format (tabs, double quotes, width 100). English everywhere.
- Conventional commits (`feat|fix|chore|docs|style|refactor|perf|test|build|ci|revert`), enforced by commitlint in the `commit-msg` hook and on PRs. Pre-commit runs lint-staged, and pre-push runs `pnpm check`. Never push to `main` or `staging` directly (see `AGENTS.md`).

## Running

```bash
cp .env.example .env
pnpm install
pnpm db:migrate
pnpm dev
pnpm check
```

The single `.env` sits at the repo root. `apps/web/next.config.ts` and `apps/server/prisma.config.ts` load it explicitly.

## Deploying and git flow

Read [`AGENTS.md`](AGENTS.md) before any git work. Branches are `feature/`, `hotfix/`, `refactor/` or `chore/`, opened as PRs into `staging`. `ci.pr.yml` checks the branch name and runs the unit tests. A push to `staging` deploys staging (`cd.staging.yml`, no version). A push to `main` runs `cd.production.yml`: bump from the commits since the last tag, commit `ci: bump new version`, tag, and deploy to Vercel production. Setup lives in `docs/deployment.md`.

## Gotchas

- `next dev` and `next build` run with `--webpack` because Serwist injects a webpack config and Turbopack refuses it.
- Prisma 7: the datasource URL lives in `prisma.config.ts` (it uses `DATABASE_URL_UNPOOLED` for migrations). The client is generated into `apps/server/src/infrastructure/generated/prisma`, which is gitignored and regenerated on `postinstall`.
- `PrismaNeon` talks to Neon over WebSockets, so it can't connect to a plain local Postgres. Point local dev at a Neon branch.
- The service worker must reference `self.__SW_MANIFEST` literally, so `sw.ts` uses `declare const self`.
- The tsconfig base lives in `packages/config/tsconfig/base.json` rather than at the root. Prisma's config loader doesn't follow symlinked `extends` out of `node_modules`.
- Facilities come from the `dataplei` warehouse through `WarehouseFacilityRepository` when `DATA_WAREHOUSE_URL` is set (read-only, cached 5 min), otherwise from mocks. Only locations with at least one reservation ever are listed, and co-located records sharing a base name (before " | ") are merged into one facility with `memberIds` (`merge-colocated-facilities.ts`). Follow `~/www/plei/plei-data-catalog` (`AGENTS.md`, `tables/dim_location.yml`) before touching queries, and never select columns it tags `hide`. Logos are the exception: `avatarUrl` comes from the bronze `plei_bronze.companies.logo` (joined on `dim_location.company_id`) through `companyLogoUrl`, which URL-encodes the file name. MapLibre needs WebGL, so tests mock `maplibre-gl`.
- MapLibre v6 ships its web worker as ES modules (`maplibre-gl-worker.mjs` imports `maplibre-gl-shared.mjs`), and webpack can't bundle that. `apps/web/scripts/copy-maplibre-worker.mjs` copies both files to `public/maplibre/` (gitignored) before `dev` and `build`, and the map calls `setWorkerUrl` with that path. Don't downgrade to v5: every version before 6.4.1 has a critical XSS advisory.
- `pnpm.overrides` in the root `package.json` pins patched transitive deps (`browserslist`, `deepmerge-ts`, `mysql2`) so `pnpm audit --prod --audit-level high` passes in CI.
- Sign-in is Auth.js with Google only (`src/auth.ts`). The `signIn` callback (`evaluateSignIn`) lets in verified `@plei.com` accounts and sends everyone else back to `/sign-in?error=domain&email=…` with a message. The protected layout and `requireUser()` re-check the domain on every request.
- `src/env.ts` validates only what the app itself reads (`DATABASE_URL`, `ALLOWED_EMAIL_DOMAIN`). Auth.js reads `AUTH_SECRET`, `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` itself. Without `AUTH_SECRET` every request fails. Without `DATABASE_URL`, login tracking warns once and skips.
- In-app feedback (`POST /api/v1/feedback`) files Linear issues as the "Market Health Map" Linear OAuth app (server-only `LINEAR_CLIENT_ID` + `LINEAR_CLIENT_SECRET`, client credentials grant, with `createAsUser`/`displayIconUrl` set to the submitter), falling back to a personal `LINEAR_API_KEY`. Without either the route answers 503; with `FEEDBACK_DRY_RUN=true` it only logs the would-be issue and returns a fake `DRY-n` ticket (dry-run wins over credentials). IDs live in `apps/server/src/infrastructure/providers/linear/linear-feedback-config/linear-feedback-config.ts`. See `docs/architecture.md`.
- Login tracking runs in Auth.js `events.signIn` (`trackSignIn`): one row per successful sign-in, and it never throws into the sign-in flow.
- The AI summary runs Llama 3.2 1B in the browser (WebLLM + WebGPU, `apps/web/src/infrastructure/ai`). Headless Chromium with SwiftShader downloads the model but can't run it (no f16 shaders). To test it live, launch Playwright with `--enable-unsafe-webgpu --use-angle=metal` and a persistent profile so the 880 MB model is cached. Keep the prompt's pre-interpreted facts and the worked example, because the 1B model embellishes without them.
- The root layout sets `suppressHydrationWarning` on `<html>` and `<body>` because browser extensions such as Grammarly add attributes there before React loads. It only covers those two tags' own attributes, so don't copy it onto other elements to silence a real mismatch.
- `src/proxy.ts` must export a function named `proxy`. With Auth.js, pass `NextAuth` a plain config object; a lazy `() => config` makes `auth(handler)` return something that is not a function.

Key insights prioritize period comparisons and scoped game contributions over scorecard recaps. The app's markets are warehouse regions: All markets names the largest market increases and declines by absolute games; a selected market names facility contributors, including opposing changes. Counts compare the rolling 28 completed days ending yesterday with the 28 completed days immediately before them, and a zero baseline has no percentage change. Contributor analytics load separately at `/api/v1/market-summary/insights`, after the main report; its loading or failure cannot block scorecards and charts. Browser AI generation stays in the child component and WebLLM worker, grounded in the computed contributor facts. Shared `KeyInsights` displays the sparkle icon, a plain overall-change introduction, contributor bullets, and 14px body text. Active-facility and active-market scope cards appear only in All markets. The available history does not establish statistical anomalies or seasonality.

The combined account and feedback control lives at the bottom left: improvement, bug report, the existing App metrics link for authorized viewers, then sign-out with the version. The header supplies the authenticated user and MapScopeProvider shares the current facility selection with feedback. Metrics storage, tracking and permissions are unchanged.

While App sessions are on and the heatmap request is pending (or the map cannot draw it yet), the session legend stays visible with a pulsing gradient bar and "Loading app sessions…" as a `role="status"`, so a slow warehouse response never looks like missing data. The rules hook exposes `sessionLegendState` (`loading`, `empty`, `scale`); failed or hidden sessions hide the legend.

The map layers control groups App sessions under Demand and independent Active facilities and Inactive facilities switches under Supply. Both facility statuses start visible; filtering uses `isActive` before clustering so counts and previews follow the selected supply scope.

App sessions demographic filtering is gated by `player-demographic-filters` (off by default). `AppSessionFilters` under Demand starts with Add filter and shows only added fields as removable chips with custom glass option lists; it stages gender, stored skill description and inclusive minimum/maximum ages with either bound optional until Apply; Reset clears both draft and applied filters. `MapLayersProvider` holds the applied cohort and the scale legend names it even after the menu closes. The API validates query parameters and the warehouse uses bound parameters in an `EXISTS` profile predicate, preserving session counts and the existing coordinate aggregation. `/api/v1/app-session-heatmap/filters` loads actual profile choices independently. Each cohort and the choices cache for five minutes; the server cohort cache is capped at 100 entries. Warehouse failures propagate as errors instead of empty activity.

With `player-demographic-filters` enabled, Demand selects App sessions or User registrations with one shared visibility switch. Registrations count distinct confirmed `pleiapp_player` accounts over the last 28 completed days, grouped by region and placed at median facility coordinates. Regions without valid facility coordinates are omitted; the legend describes market placement rather than precise registration locations. Demographic filters apply to both metrics, and cache keys include the metric. Reset restores App sessions; disabling the flag restores the existing sessions path.

Registration rendering uses a stronger heatmap intensity and wider radius for isolated market points. Its legend uses individual visible market counts, rather than summing nearby markets into session viewport areas. Switching back restores the session paint settings.

The Demand picker uses a custom glass listbox matching the demographic filter option menus, with selected checkmarks, arrow/Home/End navigation, Escape dismissal, outside-click dismissal, and focus restoration on selection.

`useFeatureFlag` resolves every UI feature flag to true under `next dev` (`NODE_ENV=development`), including while saved settings load. Staging and production builds honor the saved flags. Admin controls still display and edit persisted settings; the local override does not write to the database.
`facility-games-layer` gates a Supply selector for Facilities or Games (last 28 completed days). Facility map DTOs include `gamesLast28Days` from existing facility metrics, including merged co-located totals. MapLibre clusters sum that field into `gameCount`; Games mode displays that total on clusters and each facility’s count in its glass badge. Badges remain pointer-transparent, preserving facility hover and detail-click handlers. Facilities exposes an optional Show inactive facilities sub-filter, off by default. Games hides this sub-filter and excludes all facilities with zero games; Games is the default and Reset restores Games; flag-off keeps facility logo badges. Counts of 1,000 or more use compact notation with at most one decimal place (for example, 1.4K).

The Supply Department multi-select is shared by Games and Facilities under `facility-games-layer`. No selection includes all departments; multiple choices are ORed. Warehouse game counts classify Magic first by partner IDs 6, 52, 62, then Organizers by distinct partners with a current non-deleted Organizer Program term in `fct_terms`, and remaining games as Partnerships. Each facility DTO includes disjoint department totals; co-located facilities sum them. Selected departments determine game badge totals and the matching venues in Facilities mode over the same 28 completed days. Switching metrics preserves selections, and Reset clears them. Organizer membership is current-state, not reconstructed historical membership. Facility detail/hover data retains its existing unfiltered behavior.

Supply filters share Demand’s Add filter flow and styling: choose Department, edit a removable chip, stage multi-select options and Apply. Reset clears the chip and applied selection.
