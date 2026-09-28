# Architecture

## Layers

| Package | Responsibility | May import |
| --- | --- | --- |
| `@market-health-map/domain` | Entities, value rules (`guard`), `DomainError` | nothing |
| `@market-health-map/application` | Use cases, ports, DTOs (Zod), mappers, errors, fakes | domain, zod |
| `@market-health-map/infrastructure` | Prisma repositories, record mappers, system adapters | application, domain |
| `@market-health-map/i18n` | Message catalogs and locale detection | nothing |
| `@market-health-map/web` | Next.js delivery: pages, API routes, Clerk, React Query, PWA | everything |

Shared packages ship raw TypeScript. Next transpiles them via `transpilePackages`, and Vitest resolves their aliases with `vite-tsconfig-paths`.

## Ports and adapters

| Port (application) | Adapter (infrastructure) | Fake (application/testing) |
| --- | --- | --- |
| `LoginEventRepository` | `PrismaLoginEventRepository` | `InMemoryLoginEventRepository` |
| `Clock` | `SystemClock` | `FixedClock` |
| `IdGenerator` | `UuidGenerator` | `SequentialIdGenerator` |
| `MarketRepository` | `SampleMarketRepository` (temporary) | `InMemoryMarketRepository` |
| `FacilityRepository` | `SampleFacilityRepository` (temporary) | `InMemoryFacilityRepository` |

`apps/web/src/server/container.ts` is the composition root. It parses the environment (`src/env.ts`, which fails fast), builds the Prisma client, and wires the use cases.

## Authentication

Clerk handles authentication. `src/proxy.ts` (Next 16 middleware) protects every route except `/sign-in`, `/sign-up`, and `/~offline`. The sign-in page uses Clerk's `<SignIn />` with the same appearance as PleiOS (`src/lib/clerk/clerk-appearance.ts`, plus the `@layer clerk` rules in `globals.css`). Which SSO providers appear on the page is configured in the Clerk dashboard, not in code.

API routes call `requireUser()` (`src/server/api/authenticate.ts`), which throws `UnauthorizedError`. That becomes a localized 401.

## Login tracking (adoption monitoring)

```
(protected)/layout.tsx
  -> trackCurrentLogin()            Clerk auth() + currentUser()
    -> recordLogin(use case)        idempotent per Clerk sessionId
      -> LoginEventRepository.save  upsert on login_events.session_id
```

One `login_events` row is written per Clerk session: user id, session id, email, and first-seen time. `GET /api/v1/logins?limit=` returns the most recent rows. `useRecentLogins` fetches them for the `RecentLogins` panel on the home page.

## Market health map

```
MarketHealthMap (client)  ->  useMarketHealth  ->  GET /api/v1/markets
  -> listMarketHealth (use case, weakest markets first)
    -> MarketRepository.listActive  ->  SampleMarketRepository (seed in infrastructure/src/sample)
```

A `Market` has a location plus metrics: active players, games last week, facilities, and a 0–100 health score. The health status is derived from the score: `healthy` at 70 or above, `watch` at 40 or above, `at-risk` below 40.

The map is MapLibre GL on the OpenFreeMap Positron basemap (`tiles.openfreemap.org`), which is free, needs no key, has no usage limits, and allows commercial use. The heat layer is weighted by the selected metric, normalized so the top market is 1. Circle markers are colored by health status. Clicking one selects the market: the marker gets a dark ring, the map shifts it clear of the panel, and `MarketDetailPanel` opens on the right. The panel loads `GET /api/v1/markets/:id` (`getMarketDetail`, facilities sorted busiest first) and shows a skeleton while it waits. It lists the indicators at the top and the facilities below, each with an avatar (image, or colored initials when there is none). Escape or × closes it.

Sample facilities are generated deterministically per market in `infrastructure/src/sample/sample-facilities.ts`, and their games and players add up to the market totals.

The markets are the real Plei regions from the PleiOS catalog (`infrastructure/src/sample/plei-regions.ts`): name, state, country, currency, and facility count. Internal and test regions (Automation, L2M/M2M, Lucas, Pipelines, TEST - …) are left out. The catalog has no coordinates, so each region uses its metro center. Players, games, and health score are still generated sample values. A region with no facilities gets the gray `inactive` status. To use live data, add a repository that implements `MarketRepository` and change one line in `apps/web/src/server/container.ts`.

## API conventions

- Versioned routes under `app/api/v1`.
- Handlers stay thin: authenticate, validate (Zod inside the use case), call the use case, respond.
- Success returns `{ data, meta? }`. Errors return `{ error: { code, message, details? } }`, mapped in `src/server/api/errors.ts` with localized messages.

## i18n and PWA

The locale comes from `Accept-Language` (`getRequestLocale`), falling back to `en`. The root layout passes the catalog to `MessagesProvider` and a matching Clerk localization to `ClerkProvider`.

Serwist builds `public/sw.js` from `src/app/sw.ts`, which precaches the build and falls back to `/~offline` for document requests. `src/app/manifest.ts` produces the web manifest.
