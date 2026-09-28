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

One `login_events` row is written per Clerk session: user id, session id, email, and first-seen time. `GET /api/v1/logins?limit=` returns the most recent rows. There is no screen for them yet.

## Facilities map

```
FacilitiesMap (client)  ->  useFacilities  ->  GET /api/v1/facilities
  -> listFacilities (use case)
    -> FacilityRepository.listAll  ->  SampleFacilityRepository (mock, infrastructure/src/sample)
```

The home page is only the map: a full-screen MapLibre GL map on the OpenFreeMap Positron basemap (free, no key, commercial use allowed), with one dot per facility. The Plei logo floats top-left and the Clerk avatar top-right; there is no header bar. Hovering a dot shows a card with the facility's logo (colored initials until real logos exist) and name. Clicking selects it: the dot gets a dark ring, the map shifts it clear of the panel, and `FacilityPanel` opens on the right with only the logo and name. Escape or × closes it. The selection paint expressions are validated against the real MapLibre style spec in `FacilitiesMapComponent.styles.test.ts`, because the MapLibre mock in the rules tests accepts anything. Zoom controls sit bottom-right, and the OpenStreetMap credit (required by its license) is a small line bottom-left.

The facilities are mocks. Each real Plei region (`plei-regions.ts`, test and internal regions excluded) gets as many facilities as its facility count, scattered deterministically within about 0.3° of the region's metro center. Replacing them with real facilities from the database is tracked in PROD-443.

## API conventions

- Versioned routes under `app/api/v1`.
- Handlers stay thin: authenticate, validate (Zod inside the use case), call the use case, respond.
- Success returns `{ data, meta? }`. Errors return `{ error: { code, message, details? } }`, mapped in `src/server/api/errors.ts` with localized messages.

## i18n and PWA

The locale comes from `Accept-Language` (`getRequestLocale`), falling back to `en`. The root layout passes the catalog to `MessagesProvider` and a matching Clerk localization to `ClerkProvider`.

Serwist builds `public/sw.js` from `src/app/sw.ts`, which precaches the build and falls back to `/~offline` for document requests. `src/app/manifest.ts` produces the web manifest.
