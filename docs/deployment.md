# Deployment

Hosting is Vercel. Deploys run from GitHub Actions, never from Vercel's Git integration.

## Pipelines

| Workflow | Trigger | What it does |
| --- | --- | --- |
| `ci.pullrequest.yml` | PR into `staging` or `main` | commitlint on the PR's commits, then `_ci.yml` |
| `ci.staging.yml` | Push to `staging` (a merged PR), or a manual run | `_ci.yml`, then migrations and a deploy to **staging** (Vercel Preview) |
| `ci.production.yml` | Push to `main` (a merged PR), or a manual run | `_ci.yml` (unit tests and the rest), then **release** (bump `package.json`, write `CHANGELOG.md`, tag `vX.Y.Z`, push), then migrations and a deploy of that tag to **production** behind the `production` environment's reviewers |
| `_ci.yml` | Reusable | Lint, typecheck, coverage (95%), build, audit, plus Neon integration tests when their secrets are set |
| `_deploy-vercel.yml` | Reusable | Checks out the given ref, runs `pnpm db:deploy`, `vercel pull`, `vercel build`, `vercel deploy --prebuilt`, and aliases `STAGING_DOMAIN` |

The release commit is `chore(release): vX.Y.Z [skip ci]`, so pushing it doesn't start another run. After a release, merge `main` back into `staging`. The branching and commit rules are in [`AGENTS.md`](../AGENTS.md).

### Branch protection (recommended)

- `main` and `staging`: require a PR and a passing `ci.pullrequest.yml`, and block direct pushes.
- `main`: allow `github-actions[bot]` to push, so the release job can push its commit and tag. Otherwise use a deploy key or PAT in `release`.

## One-time setup

### Vercel

1. Create a project from this repo and set **Root Directory** to `apps/web`. Leave the build and install commands to `apps/web/vercel.json`, and select Node 24.
2. Under **Git**, disconnect the repository, or set `git.deploymentEnabled: false`, so GitHub Actions stays the only thing that deploys.
3. Add the environment variables below under **Preview** (staging values) and **Production** (production values).
4. Create a token (Account → Tokens). Copy the org and project IDs from `.vercel/project.json` after running `vercel link`.

### GitHub

- Repository secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.
- Environment `staging`: secret `DATABASE_URL_UNPOOLED` (the staging Neon branch). Optionally add a variable `STAGING_DOMAIN`, for example `market-health-map-staging.vercel.app`.
- Environment `production`: secret `DATABASE_URL_UNPOOLED` (the production Neon branch), plus **Required reviewers**.
- Optional, for the integration job: repository secrets `NEON_TEST_DATABASE_URL` and `NEON_TEST_DATABASE_URL_UNPOOLED`.

## Runtime environment (Vercel)

| Variable | Notes |
| --- | --- |
| `DATABASE_URL` | Neon pooled connection string |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk instance for that environment |
| `CLERK_SECRET_KEY` | Server-only |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` | `/` |

`DATABASE_URL_UNPOOLED` is only needed in GitHub Actions, for migrations.

## Clerk / SSO

1. Use one Clerk instance for staging and a separate production instance, both separate from PleiOS.
2. Turn on the SSO connection (Google Workspace or SAML for `plei.com`) under **User & Authentication**.
3. Limit sign-ups to `plei.com` (**Restrictions → Allowlist**).
4. On the production instance, add the Vercel production domain.

## Database

One Neon project, with a branch each for `staging` and `production`. Migrations run in the deploy job before the new build goes live. That order is safe as long as migrations are additive, so old and new code can both run during the switch.

## Gotchas

- `vercel build` runs on the GitHub runner and reads settings from `vercel pull`. It uses `apps/web/vercel.json` (`pnpm build`, which is `next build --webpack` for Serwist).
- `SKIP_INSTALL_SIMPLE_GIT_HOOKS=1` is set in CI so installs don't try to write git hooks.
- Commercial use needs a Vercel Pro or Team plan. The Hobby plan is for personal use only.
