# Market Health Map: agent guide

An internal Plei tool that shows market health across supply, player activity, facilities, organizers, game quality, and technology incidents. It lives in its own repo, separate from PleiOS and the Plei app, so its releases never block theirs.

Must-haves (from the Linear project): SSO login, tracking which internal users log in and when (adoption), and documenting how agents were used (`docs/agent-usage.md`).

## Architecture

pnpm + Turborepo monorepo with clean architecture. Each arrow points at what the layer depends on, and inner layers never import outer ones:

```
domain  <-  application  <-  infrastructure  <-  apps/web
```

- `packages/domain`: pure entities (`LoginEvent`), `guard`, `DomainError`, `EntityId`. No runtime deps.
- `packages/application`: use-case factories (`makeRecordLogin`, `makeListRecentLogins`), ports, Zod DTOs, mappers, and errors. In-memory fakes live in `src/testing`.
- `packages/infrastructure`: Prisma 7 + Neon adapter, repositories, record mappers, `SystemClock`, and `UuidGenerator`.
- `packages/i18n`: typed `en` and `pt-BR` catalogs, `getMessages`, and `parseAcceptLanguage`.
- `packages/config`: shared tsconfig presets and the Vitest factory (95% thresholds).
- `apps/web`: Next.js 16 App Router, Clerk, React Query, and the Serwist PWA. `src/server/container.ts` is the only place that creates concrete adapters.

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
- Conventional commits (commitlint). Pre-commit runs lint-staged, and pre-push runs `pnpm check`.

## Running

```bash
cp .env.example .env
pnpm install
pnpm db:migrate
pnpm dev
pnpm check
```

The single `.env` sits at the repo root. `apps/web/next.config.ts` and `packages/infrastructure/prisma.config.ts` load it explicitly.

## Deploying

Vercel, driven by GitHub Actions. A merge to `main` deploys staging (`ci.staging.yml`). A `v*` tag deploys production after approval (`ci.production.yml`). PRs run `ci.pullrequest.yml`. All three reuse the checks in `_ci.yml`. Setup lives in `docs/deployment.md`.

## Gotchas

- `next dev` and `next build` run with `--webpack` because Serwist injects a webpack config and Turbopack refuses it.
- Prisma 7: the datasource URL lives in `prisma.config.ts` (it uses `DATABASE_URL_UNPOOLED` for migrations). The client is generated into `packages/infrastructure/src/generated/prisma`, which is gitignored and regenerated on `postinstall`.
- `PrismaNeon` talks to Neon over WebSockets, so it can't connect to a plain local Postgres. Point local dev at a Neon branch.
- The service worker must reference `self.__SW_MANIFEST` literally, so `sw.ts` uses `declare const self`.
- The tsconfig base lives in `packages/config/tsconfig/base.json` rather than at the root. Prisma's config loader doesn't follow symlinked `extends` out of `node_modules`.
- The market map uses sample data (`SampleMarketRepository`) until a real market data source is chosen. MapLibre needs WebGL, so tests mock `maplibre-gl`, and the map is created inside a `useEffect` via a dynamic import.
- Login tracking runs in `app/(protected)/layout.tsx` via `trackCurrentLogin()`. It is idempotent per Clerk session and never throws into the render.
