# AGENTS.md

A guide for coding agents working in this repo. `CLAUDE.md` has the full architecture and code conventions. This file adds the rules for **git, commits, and releases** that every agent must follow.

## Git flow (mandatory)

Two long-lived branches, each with its own pipeline:

| Branch | Purpose | Pipeline on push |
| --- | --- | --- |
| `staging` | Integration and QA | `ci.staging.yml`: CI, then deploy to Vercel **staging** (Preview) |
| `main` | Production | `ci.production.yml`: CI (unit tests), then version bump and tag, then deploy to Vercel **production** |

Rules:

1. **Never push directly to `main` or `staging`.** Branch from `staging` with `feat/<linear-id>-<slug>`, `fix/<linear-id>-<slug>` or `chore/<slug>`.
2. Open a PR **into `staging`**. `ci.pullrequest.yml` must pass (commitlint plus lint, typecheck, coverage, build, audit) before merging.
3. Promote to production with a PR from **`staging` into `main`**. Merging it releases.
4. After a release, merge `main` back into `staging` so the release commit and `CHANGELOG.md` flow back.
5. Hotfixes branch from `main` (`fix/<slug>`), go into `main` by PR, then back-merge into `staging`.

## Commit messages (enforced)

[Conventional Commits](https://www.conventionalcommits.org/), checked by commitlint in two places:

- locally, in the `commit-msg` git hook (`simple-git-hooks`, installed by `pnpm install`)
- on every PR, in the `commitlint` job of `ci.pullrequest.yml`

Allowed types: `feat`, `fix`, `chore`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `revert`.

```
feat(map): show facility name on hover
fix(auth): keep the session after the Clerk redirect
chore: bump maplibre-gl to 6.11.2
```

Other hooks: `pre-commit` runs lint-staged (Biome on staged files), and `pre-push` runs `pnpm check` (lint, typecheck, and tests at 95% coverage).

## Releases

On every merge to `main`, `ci.production.yml` runs:

1. **CI**: the unit tests, plus lint, typecheck, build and audit.
2. **Release**: `pnpm release` (`commit-and-tag-version`, configured in `.versionrc.json`) reads the commits since the last tag, bumps `version` in the root `package.json`, updates `CHANGELOG.md`, commits `chore(release): vX.Y.Z [skip ci]`, and pushes the commit and tag `vX.Y.Z` to `main`.
3. **Deploy**: it builds and deploys the **tag** to Vercel production (after the `production` environment's approval).

Bumps follow the commit types: `feat` → minor, `fix` and `perf` → patch, `BREAKING CHANGE` → major. Before 1.0.0, `feat` bumps the patch and breaking changes bump the minor. Never edit `version` or `CHANGELOG.md` by hand.

## Before you finish a task

- `pnpm check` passes.
- Docs in `CLAUDE.md` and `docs/` match what changed.
- A row is added to `docs/agent-usage.md` for meaningful agent-assisted work (a project must-have).

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
