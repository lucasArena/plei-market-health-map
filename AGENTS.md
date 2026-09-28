# AGENTS.md

A guide for coding agents working in this repo. `CLAUDE.md` has the full architecture and code conventions. This file adds the rules for **git, branches, commits, and releases** that every agent must follow.

## Git flow (mandatory)

Two long-lived branches, each with its own pipeline:

| Branch | Purpose | Pipeline on push |
| --- | --- | --- |
| `staging` | Integration and QA | `cd.staging.yml`: deploy the branch head to Vercel **staging**. No version bump, no tag |
| `main` | Production | `cd.production.yml`: bump the version (`vX.Y.Z`), commit, tag, deploy that tag to Vercel **production** |

Rules:

1. **Never push directly to `main` or `staging`.** Create a branch from `staging` named with one of these prefixes, then a lowercase slug (`a-z 0-9 . _ -`):
   - `feature/<slug>`: new behavior (bumps the **minor**)
   - `hotfix/<slug>`: bug fixes (bumps the **patch**)
   - `refactor/<slug>`: internal changes with no behavior change (no bump)
   - `chore/<slug>`: tooling, deps and docs (no bump)
2. Open a PR **into `staging`**. `ci.pr.yml` checks the branch name and runs the unit tests, and both must pass.
3. Promote to production with a PR from **`staging` into `main`**, merged with a **merge commit** (not squash). That is the only branch allowed without a prefix. Feature and hotfix PRs into `staging` should be **squashed**.
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

Only **production** is versioned. `scripts/release/next-version.mjs` (tests in `next-version.test.mjs`, run by `pnpm test:scripts`) reads the non-merge commits since the last `vX.Y.Z` tag and counts them:

| Commit | Effect |
| --- | --- |
| `feat:` / `feature:` | **+1 minor** for each commit (patch resets) |
| `fix:` / `hotfix:` | **+1 patch** for each commit |
| `type!:` or `BREAKING CHANGE` | **+1 major** (minor and patch reset) |
| `refactor`, `chore`, `docs`, … | no bump |

Merge commits are skipped, so a squashed PR counts once and a merged PR counts its own commits, never the merge on top. For example, `v0.1.1` followed by one feature and one hotfix gives `v0.2.1`.

On a push to `main`, `_release.yml` sets `version` in the root `package.json`, commits it as `ci: bump new version vX.Y.Z [skip ci]`, creates an annotated tag, and pushes both. `_deploy-vercel.yml` then deploys **that tag**. If nothing needs a bump, nothing is tagged and `main`'s head is deployed. `staging` never bumps or tags. Never edit `version` by hand.

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
