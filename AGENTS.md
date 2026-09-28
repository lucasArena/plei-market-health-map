# AGENTS.md

A guide for coding agents working in this repo. `CLAUDE.md` has the full architecture and code conventions. This file adds the rules for **git, branches, commits, and releases** that every agent must follow.

## Git flow (mandatory)

Two long-lived branches, each with its own pipeline:

| Branch | Purpose | Pipeline on push |
| --- | --- | --- |
| `staging` | Integration and QA | `cd.staging.yml`: bump to a release candidate (`vX.Y.Z-rc.N`), tag, deploy to Vercel **staging** |
| `main` | Production | `cd.production.yml`: bump to a stable version (`vX.Y.Z`), tag, deploy to Vercel **production** |

Rules:

1. **Never push directly to `main` or `staging`.** Create a branch from `staging` named with one of these prefixes, then a lowercase slug (`a-z 0-9 . _ -`):
   - `feature/<slug>`: new behavior (bumps the **minor**)
   - `hotfix/<slug>`: bug fixes (bumps the **patch**)
   - `refactor/<slug>`: internal changes with no behavior change (no bump)
   - `chore/<slug>`: tooling, deps and docs (no bump)
2. Open a PR **into `staging`**. `ci.pr.yml` checks the branch name and runs the unit tests, and both must pass.
3. Promote to production with a PR from **`staging` into `main`**. That is the only branch allowed without a prefix.
4. After a production release, merge `main` back into `staging`.

## Commit messages (enforced locally)

[Conventional Commits](https://www.conventionalcommits.org/), checked by commitlint in the `commit-msg` git hook (`simple-git-hooks`, installed by `pnpm install`). Allowed types: `feat`, `fix`, `chore`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `revert`.

```
feat(map): show facility name on hover
fix(auth): keep the session after the Google redirect
chore: bump maplibre-gl to 6.11.2
```

Other hooks: `pre-commit` runs lint-staged (Biome on staged files), and `pre-push` runs `pnpm check` (lint, typecheck, tests at 95% coverage, and the release script tests). CI on PRs runs only the branch-name check and the unit tests, so these local hooks are the lint and typecheck gate.

## Versioning and releases

`scripts/release/next-version.mjs` (tests in `next-version.test.mjs`, run by `pnpm test:scripts`) reads the commits since the last **stable** tag and counts them:

| Commit | Effect |
| --- | --- |
| `feat:` / `feature:`, or a merge from `feature/…` | **+1 minor** for each commit (patch resets) |
| `fix:` / `hotfix:`, or a merge from `hotfix/…` | **+1 patch** for each commit |
| `type!:` or `BREAKING CHANGE` | **+1 major** (minor and patch reset) |
| `refactor`, `chore`, `docs`, … | no bump |

For example, `v0.1.1` followed by 2 features and 1 hotfix gives `v0.3.1`.

On a push to either branch, `_release.yml`:

1. works out the next version: stable `vX.Y.Z` for `main`, release candidate `vX.Y.Z-rc.N` for `staging`;
2. sets `version` in the root `package.json` and commits it as `ci: bump new version vX.Y.Z [skip ci]`;
3. creates an annotated tag and pushes the commit and tag to the branch.

Then `_deploy-vercel.yml` deploys **that tag**. If no commit needs a bump, nothing is tagged and the branch head is deployed as is. Never edit `version` by hand.

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
