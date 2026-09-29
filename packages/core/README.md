# @market-health-map/core

The framework-free heart of the app, shared by web and server. It has no Next.js, Hono, Prisma or React, only TypeScript and Zod.

| Entry point | What it holds | May import |
| --- | --- | --- |
| `@market-health-map/core/domain` | Entities (`Facility`, `LoginEvent`, `Market`), `guard`, `DomainError`, `EntityId` | nothing |
| `@market-health-map/core/application` | Use cases (`makeListFacilities`, `makeGetFacilityDetail`, …), ports, Zod DTOs, mappers, errors | domain |
| `@market-health-map/core/application/testing` | In-memory fakes for tests (`InMemoryFacilityRepository`, `FixedClock`, …) | domain, application |
| `@market-health-map/core/i18n` | Typed `en` and `pt-BR` catalogs, `getMessages`, `parseAcceptLanguage` | nothing |

Biome enforces the "May import" column (`noRestrictedImports` in `biome.json`).

```bash
pnpm --filter @market-health-map/core test
```

Use cases are tested with the in-memory fakes, never with database mocks.
