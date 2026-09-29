# Market Health Map: agent guide

An internal Plei tool that shows market health across supply, player activity, facilities, organizers, game quality, and technology incidents. It lives in its own repo, separate from PleiOS and the Plei app, so its releases never block theirs.

Must-haves (from the Linear project): SSO login, tracking which internal users log in and when (adoption), and documenting how agents were used (`docs/agent-usage.md`).

## Architecture

pnpm + Turborepo monorepo with clean architecture. Each arrow points at what the layer depends on, and inner layers never import outer ones:

```
domain  <-  application  <-  infrastructure  <-  apps/web
```

- `packages/domain`: pure entities (`LoginEvent`), `guard`, `DomainError`, `EntityId`. No runtime deps.
- `packages/application`: use-case factories (`makeRecordLogin`, `makeListRecentLogins`, `makeListFacilities`), ports, Zod DTOs, mappers, and errors. In-memory fakes live in `src/testing`.
- `packages/infrastructure`: Prisma 7 + Neon adapter, repositories, record mappers, `SystemClock`, and `UuidGenerator`.
- `packages/i18n`: typed `en` and `pt-BR` catalogs, `getMessages`, and `parseAcceptLanguage`.
- `packages/config`: shared tsconfig presets and the Vitest factory (95% thresholds).
- `packages/design-system`: shared Pleiful design tokens for application and visualization code.
- `apps/web`: Next.js 16 App Router, Auth.js (Google SSO), React Query, and the Serwist PWA. `src/server/container.ts` is the only place that creates concrete adapters.

Pleiful brand colors are documented in `docs/design-system.md`. TypeScript consumers use
`@market-health-map/design-system`; Tailwind and CSS consumers use the matching `pleiful-*` theme colors.

See `docs/architecture.md` for more depth.

## Conventions (non-negotiable)

- **No comments in code.** Names and tests carry the meaning.
- **All `interface`/`type` declarations live in `*.types.ts` files** and are imported where they're used.
- **No nested ternaries.** For more than one condition, use the computed-key object pattern (`{ [`${a}`]: x, [`${b}`]: y }.true`), with low-priority keys first.
- **Path aliases only.** No relative imports. Apps use `@/*`. Packages use their own alias (`@domain/*`, `@application/*`, `@infra/*`, `@i18n/*`). Cross-package imports go through `@market-health-map/<pkg>`. Every consumer's `tsconfig.paths` must list every alias it loads transitively.
- One folder per React component: `Name/NameComponent.tsx` plus `.types.ts`, `.rules.ts`, and `.test.tsx` siblings. The `.rules.ts` hook holds all the logic, and the component only renders.
- Named exports only. Default exports are allowed only for Next.js pages, layouts, and `manifest`.
- Validate every boundary with Zod. No user-facing string is hardcoded; it comes from `@market-health-map/i18n`.
- Tests sit next to the code as `*.test.ts(x)`. Coverage must be ≥ 95% in every package. Use cases are tested with in-memory fakes, never DB mocks.
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

The single `.env` sits at the repo root. `apps/web/next.config.ts` and `packages/infrastructure/prisma.config.ts` load it explicitly.

## Deploying and git flow

Read [`AGENTS.md`](AGENTS.md) before any git work. Branches are `feature/`, `hotfix/`, `refactor/` or `chore/`, opened as PRs into `staging`. `ci.pr.yml` checks the branch name and runs the unit tests. A push to `staging` deploys staging (`cd.staging.yml`, no version). A push to `main` runs `cd.production.yml`: bump from the commits since the last tag, commit `ci: bump new version`, tag, and deploy to Vercel production. Setup lives in `docs/deployment.md`.

## Gotchas

- `next dev` and `next build` run with `--webpack` because Serwist injects a webpack config and Turbopack refuses it.
- Prisma 7: the datasource URL lives in `prisma.config.ts` (it uses `DATABASE_URL_UNPOOLED` for migrations). The client is generated into `packages/infrastructure/src/generated/prisma`, which is gitignored and regenerated on `postinstall`.
- `PrismaNeon` talks to Neon over WebSockets, so it can't connect to a plain local Postgres. Point local dev at a Neon branch.
- The service worker must reference `self.__SW_MANIFEST` literally, so `sw.ts` uses `declare const self`.
- The tsconfig base lives in `packages/config/tsconfig/base.json` rather than at the root. Prisma's config loader doesn't follow symlinked `extends` out of `node_modules`.
- Facilities come from the `dataplei` warehouse through `WarehouseFacilityRepository` when `DATA_WAREHOUSE_URL` is set (read-only, cached 5 min), otherwise from mocks. Follow `~/www/plei/plei-data-catalog` (`AGENTS.md`, `tables/dim_location.yml`) before touching queries, and never select columns it tags `hide`. MapLibre needs WebGL, so tests mock `maplibre-gl`.
- MapLibre v6 ships its web worker as ES modules (`maplibre-gl-worker.mjs` imports `maplibre-gl-shared.mjs`), and webpack can't bundle that. `apps/web/scripts/copy-maplibre-worker.mjs` copies both files to `public/maplibre/` (gitignored) before `dev` and `build`, and the map calls `setWorkerUrl` with that path. Don't downgrade to v5: every version before 6.4.1 has a critical XSS advisory.
- `pnpm.overrides` in the root `package.json` pins patched transitive deps (`browserslist`, `deepmerge-ts`, `mysql2`) so `pnpm audit --prod --audit-level high` passes in CI.
- Sign-in is Auth.js with Google only (`src/auth.ts`). The `signIn` callback (`evaluateSignIn`) lets in verified `@plei.com` accounts and sends everyone else back to `/sign-in?error=domain&email=…` with a message. The protected layout and `requireUser()` re-check the domain on every request.
- `src/env.ts` validates only what the app itself reads (`DATABASE_URL`, `ALLOWED_EMAIL_DOMAIN`). Auth.js reads `AUTH_SECRET`, `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` itself. Without `AUTH_SECRET` every request fails. Without `DATABASE_URL`, login tracking warns once and skips.
- Login tracking runs in Auth.js `events.signIn` (`trackSignIn`): one row per successful sign-in, and it never throws into the sign-in flow.
- `src/proxy.ts` must export a function named `proxy`. With Auth.js, pass `NextAuth` a plain config object; a lazy `() => config` makes `auth(handler)` return something that is not a function.
