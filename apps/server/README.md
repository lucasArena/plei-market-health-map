# @market-health-map/server

The HTTP API (Hono) and every adapter to the outside world: the Neon Postgres database for login tracking (Prisma) and the read-only `dataplei` warehouse for facilities, game stats and app sessions. Web mounts it at `/api/v1`, so it runs inside the web deployment rather than on its own.

## Layout

| Folder | What lives there |
| --- | --- |
| `src/presentation/http` | `createApiApp` (Hono), one route file per resource, the auth guard, response envelopes and error mapping |
| `src/presentation/auth` | `trackSignIn`, called from Auth.js when someone signs in |
| `src/infrastructure` | Prisma repository, warehouse repositories and caches, sample data, clock and ids |
| `src/container.ts` | Composition root: picks warehouse or sample adapters from the environment and wires the use cases |
| `prisma/` | Schema and migrations |

## Commands

Run these from the repo root:

```bash
pnpm --filter @market-health-map/server test
pnpm --filter @market-health-map/server test:integration
pnpm db:migrate
```

`test:integration` needs a Neon branch in `DATABASE_URL`. Warehouse queries follow `plei-data-catalog`, and never select columns tagged `hide`.

See [docs/architecture.md](../../docs/architecture.md) for the ports, adapters and API conventions.
