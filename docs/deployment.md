# Deployment

Hosting is Vercel. Deploys run from GitHub Actions, never from Vercel's Git integration.

## Pipelines

| Workflow | Trigger | What it does |
| --- | --- | --- |
| `ci.pr.yml` | PR into `staging` or `main` | Branch-name check (`hotfix/`, `feature/`, `refactor/`, `chore/`; plus `staging` → `main`), then unit tests (`pnpm test`, `pnpm test:scripts`) |
| `cd.staging.yml` | Push to `staging`, or a manual run | Deploy the branch head to **staging** (Vercel Preview). No bump, no tag |
| `cd.production.yml` | Push to `main`, or a manual run | `_release.yml` (bump to `vX.Y.Z` from the commits since the last tag), then deploy that tag to **production** |
| `_release.yml` | Reusable (production only) | `.github/scripts/release/next-version.mjs` plans the version from non-merge commits since the last tag, then commits `ci: bump new version vX.Y.Z [skip ci]`, tags, and pushes |
| `_deploy-vercel.yml` | Reusable | Checks out the given ref, runs `pnpm db:deploy`, `vercel pull`, `vercel build`, `vercel deploy --prebuilt`, and aliases `STAGING_DOMAIN` |

The bump rules are in [`AGENTS.md`](../AGENTS.md#versioning-and-releases).

### Branch protection (recommended)

- `main` and `staging`: require a PR and a passing `ci.pr.yml`, and block direct pushes.
- `main`: allow `github-actions[bot]` to push, so `_release.yml` can push its bump commit and tag. Otherwise use a deploy key or PAT there.

## One-time setup

### Vercel

1. Create a project from this repo and set **Root Directory** to `apps/web`. Leave the build and install commands to `apps/web/vercel.json`, and select Node 24.
2. Under **Git**, disconnect the repository, or set `git.deploymentEnabled: false`, so GitHub Actions stays the only thing that deploys.
3. Add the environment variables below under **Preview** (staging values) and **Production** (production values).
4. Create a token (Account → Tokens). Copy the org and project IDs from `.vercel/project.json` after running `vercel link`.

### GitHub

- Repository secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.
- Linear releases: in Linear, go to **Settings → Releases** and create a **continuous** pipeline named `Market Health Map` for the Product team. Generate its access key (a personal API key does not work) and save it as the repository secret `LINEAR_ACCESS_KEY`. Turn on auto-generated release notes in the pipeline settings if you also want Linear's own summary.
- Review agent: when someone requests changes on a PR, `linear-sync.yml` posts the review and its inline comments on the PR's Linear ticket, telling the agent to fix them on the same branch, and delegates the ticket to the Cursor agent (`delegate-review.mjs`), which starts a Cursor run. Set the repository variable `LINEAR_FIX_AGENT_ID` to another Linear agent's user ID to use that agent instead, or to `off` to stop delegating. Reviews by bots are ignored, so the agent can't trigger itself. Cursor only starts a run when a person who has connected Linear in Cursor delegates the ticket, and refuses one from the app ("couldn't find a Cursor user to associate with this session"). So set the repository secret `LINEAR_AGENT_API_KEY` to a personal Linear API key (Linear → Settings → Security & access → Personal API keys) of someone whose Linear is connected in Cursor (Cursor → Settings → Integrations → Linear). The comment and the delegation are then made as that person; without it they fall back to the app.
- Conflict agent: on every push to `staging`, `conflict-agent.yml` checks the open PRs into staging. A PR that just became conflicting gets the `conflicts` label, and its Linear ticket gets a comment asking the agent to merge `staging` into the branch, resolve the conflicts and push, then is delegated to the same agent as the review agent (`delegate-conflicts.mjs`). The label stops repeat hand-offs and comes off once the PR is mergeable. `LINEAR_FIX_AGENT_ID=off` turns this off too. It can also be run by hand from the Actions tab.
- Linear ticket sync: save the Market Health Map Linear app's `LINEAR_CLIENT_ID` and `LINEAR_CLIENT_SECRET` as repository secrets too. `linear-sync.yml` moves a PR's ticket to Code Review when it opens against `staging` or gets new commits, to Feedback on a changes-requested review and to Done when it merges into `staging`, and `cd.production.yml` moves every released ticket to Released. Without them the jobs only warn.
- Environment `staging`: secret `DATABASE_URL_UNPOOLED` (the staging Neon branch). Optionally add a variable `STAGING_DOMAIN`, for example `market-health-map-staging.vercel.app`.
- Environment `production`: secret `DATABASE_URL_UNPOOLED` (the production Neon branch), plus **Required reviewers**.
- Optional, for the integration job: repository secrets `NEON_TEST_DATABASE_URL` and `NEON_TEST_DATABASE_URL_UNPOOLED`.

## Runtime environment (Vercel)

| Variable | Notes |
| --- | --- |
| `DATABASE_URL` | Neon pooled connection string. Required in staging and production. If it is unset (local dev), login tracking is skipped with a single warning |
| `AUTH_SECRET` | Random 32-byte secret for signing sessions (`openssl rand -base64 32`). Use a different one per environment |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Google OAuth client credentials |
| `DATA_WAREHOUSE_URL` | Read-only Postgres URL for the `dataplei` warehouse (facilities). The warehouse must accept connections from the host. Vercel has no fixed outbound IPs on Hobby, so an IP allowlist on the warehouse will block it |
| `ALLOWED_EMAIL_DOMAIN` | Email domain allowed in (default `plei.com`) |
| `LINEAR_CLIENT_ID` / `LINEAR_CLIENT_SECRET` | Server-only credentials of the "Market Health Map" Linear OAuth app, with the client credentials grant enabled. The in-app feedback form (`POST /api/v1/feedback`) files issues as the app, showing the submitter's name and avatar. Preferred over `LINEAR_API_KEY` when both are set |
| `LINEAR_API_KEY` | Fallback: a personal Linear API key. Issues are then created as that person. Without app credentials or a key, feedback answers 503 |
| `TARGET_USER_EMAILS` | Comma-separated @plei.com emails of the people whose weekly use measures the project goal (App metrics). Everyone is still recorded; only these count toward the 75% goal. Set in Vercel Production and Preview |
| `ADMIN_EMAILS` | Comma-separated emails of the admins: the people who can open App metrics and Feature flags (the account hub links, the `/metrics` and `/feature-flags` pages and their APIs). Anyone else gets a 404 page and a 403 from the API; unset means nobody. Set in Vercel Production and Preview |
| `FEEDBACK_DRY_RUN` | `true` logs feedback instead of creating Linear issues and returns a fake `DRY-n` ticket, even when credentials are set. Leave unset or `false` in staging and production |

`DATABASE_URL_UNPOOLED` is only needed in GitHub Actions, for migrations.

## Google SSO (Auth.js)

1. In Google Cloud Console (a Plei project), create an **OAuth client ID** of type *Web application*.
2. On the same client, add an **authorized JavaScript origin** and a **redirect URI** for each environment:

   | Environment | JavaScript origin | Redirect URI |
   | --- | --- | --- |
   | Local | `http://localhost:3000` | `http://localhost:3000/api/auth/callback/google` |
   | Staging | `https://<STAGING_DOMAIN>` | `https://<STAGING_DOMAIN>/api/auth/callback/google` |
   | Production | `https://<production-domain>` | `https://<production-domain>/api/auth/callback/google` |

   Google doesn't accept wildcards, so Vercel's per-deploy preview URLs can't sign in. Register only the fixed staging alias (`STAGING_DOMAIN`) and the production domain. One client serves every environment, but each environment gets its own `AUTH_SECRET`.
3. Set the **OAuth consent screen** to **Internal** (Workspace only). The local client currently lives in Google Cloud project `plei-510021`. Google then refuses non-Plei accounts before they reach the app. The app also checks the domain itself.
4. Put the client ID and secret into `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` in Vercel (Preview and Production) and in your local `.env`.

This is free and works on `*.vercel.app` domains, with no Clerk account or custom domain needed.

## Database

One Neon project, with a branch each for `staging` and `production`. Migrations run in the deploy job before the new build goes live. That order is safe as long as migrations are additive, so old and new code can both run during the switch.

## Gotchas

- `vercel build` runs on the GitHub runner and reads settings from `vercel pull`. It uses `apps/web/vercel.json` (`pnpm build`, which is `next build --webpack` for Serwist).
- `SKIP_INSTALL_SIMPLE_GIT_HOOKS=1` is set in CI so installs don't try to write git hooks.
- Commercial use needs a Vercel Pro or Team plan. The Hobby plan is for personal use only.
