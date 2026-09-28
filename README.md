# Market Health Map

A shared view of Plei market health for internal teams (Leadership, Growth, Product). The goal is to spot changes in a market early, understand what is driving them, and act before they hurt supply, player experience, or growth.

Linear project: https://linear.app/plei/project/market-health-map-9473cd6bd213

## Quick start

```bash
cp .env.example .env
pnpm install
pnpm db:migrate
pnpm dev
```

Open http://localhost:3000. You are sent to `/sign-in` (one Google SSO button; only @plei.com accounts get in), then land on the facilities map.

## Contributing

Branch from `staging` as `feature/…`, `hotfix/…`, `refactor/…` or `chore/…`, use conventional commits (`feat: …`, `fix: …`, `chore: …`), and open a PR into `staging`. Production releases are PRs from `staging` into `main`. See [AGENTS.md](AGENTS.md).

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Runs the web app (webpack dev server) |
| `pnpm build` | Production build (includes the PWA service worker) |
| `pnpm lint` / `pnpm fix` | Biome check / check with autofix |
| `pnpm typecheck` | `tsc --noEmit` across every package |
| `pnpm test` / `pnpm test:coverage` | Vitest, with a 95% coverage gate |
| `pnpm check` | lint + typecheck + coverage (the pre-push gate) |
| `pnpm db:migrate` / `pnpm db:deploy` | Prisma migrations (dev / deploy) |
| `pnpm test:scripts` | Tests for the release version script |

## Documentation

- [AGENTS.md](AGENTS.md): git flow, commit rules and releases (read before contributing)
- [CLAUDE.md](CLAUDE.md): the guide for agents and new engineers
- [docs/architecture.md](docs/architecture.md): the layers, ports and adapters, and how login tracking works
- [docs/conventions.md](docs/conventions.md): code, testing, and git conventions
- [docs/deployment.md](docs/deployment.md): hosting, environment variables, and Google SSO setup
- [docs/agent-usage.md](docs/agent-usage.md): how agents were used on this project (a project must-have)
