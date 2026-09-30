# @market-health-map/server

The HTTP API (Hono) and every adapter to the outside world: the Neon Postgres database for login tracking (Prisma) and the read-only `dataplei` warehouse for facilities, game stats and app sessions. Web mounts it at `/api/v1`, so it runs inside the web deployment rather than on its own.

## Layout

| Folder | What lives there |
| --- | --- |
| `src/presentation/http` | `createApiApp` (Hono), one controller per resource in `controllers/`, the auth guard, response envelopes and error mapping |
| `src/infrastructure/providers/linear` | `LinearIssueTracker` (feedback to Linear issues), `LinearAppAuth` / `LinearApiKeyAuth` (OAuth app token or personal key), its dry-run twin and the team, state, label and project IDs |
| `src/presentation/auth` | `trackSignIn`, called from Auth.js when someone signs in |
| `src/infrastructure/repositories` | One folder per repository or helper (its `.ts`, `.types.ts` and `__tests__/` together). Repository implementations: Prisma (`database/`), the warehouse and its caches (`warehouse/`), sample data (`sample/`) |
| `src/infrastructure/providers/system` | Clock and id generator |
| `src/container.ts` | Composition root: picks warehouse or sample adapters from the environment and wires the services |
| `prisma/` | Schema and migrations |

## Commands

Run these from the repo root:

```bash
pnpm --filter @market-health-map/server test
pnpm --filter @market-health-map/server test:integration
pnpm db:migrate
```

`test:integration` needs a Neon branch in `DATABASE_URL`. Warehouse queries follow `plei-data-catalog`, and never select columns tagged `hide`.

`POST /api/v1/feedback` (`presentation/http/controllers/feedback-controller.ts`) caps the whole request at 4 MB (`MAX_FEEDBACK_REQUEST_BYTES` from core): it checks `Content-Length` first, then counts bytes while reading the body, and answers `413 PAYLOAD_TOO_LARGE` when either is over.

See [docs/architecture.md](../../docs/architecture.md) for the layers (controllers, services, repositories) and API conventions.
