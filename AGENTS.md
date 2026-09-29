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

The full procedure is under *Release workflow (step by step)* below.

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

After a tagged deploy, the `linear-release` job writes release notes with `scripts/release/release-notes.mjs` (tests in `release-notes.test.mjs`). The notes cover the commits since the previous stable tag, grouped into Breaking changes, Features, Fixes and Other changes, plus every Linear issue ID they mention. The job then creates a release in the **Market Health Map** Linear pipeline with `linear/linear-release-action`: the version is the tag, the notes are attached as the release notes and as a `Changelog vX.Y.Z` document, and the referenced issues are linked. The notes also go to the job summary. Without the `LINEAR_ACCESS_KEY` secret, the job only warns.

## Release workflow (step by step)

Every change reaches production the same way: **branch → staging → main**. Follow these steps in order.

### 1. Start a branch from `staging`

```bash
git fetch origin
git checkout -b feature/<slug> origin/staging
```

| Prefix | Use it for | Version effect in production |
| --- | --- | --- |
| `feature/` | New behavior | +1 minor per `feat:` commit |
| `hotfix/` | Bug fixes | +1 patch per `fix:` commit |
| `refactor/` | Internal changes, no behavior change | none |
| `chore/` | Tooling, dependencies, docs, CI | none |

The slug is lowercase, using `a-z 0-9 . _ -` (for example `feature/plei-logo-markers`). `ci.pr.yml` rejects any other name.

### 2. Commit with conventional messages

`<type>(<optional scope>): <summary>`, where the type is one of `feat`, `fix`, `chore`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `revert`. commitlint rejects anything else in the `commit-msg` hook. Match the type to the branch: `feat:` on `feature/`, `fix:` on `hotfix/`. Add `!` (as in `feat!:`) or a `BREAKING CHANGE:` footer only for breaking changes.

```
feat(map): show facilities as plei logo markers
fix(auth): keep the session after the Google redirect
chore(ci): add a deploy timeout
```

`pre-commit` runs Biome on staged files and `pre-push` runs `pnpm check`. Don't skip them with `--no-verify`.

### 3. Open a PR into `staging` and **squash and merge**

- The base is `staging`. The PR title becomes the squashed commit, so it must be a valid conventional message; it's what production counts later.
- End the title with the Linear issue, e.g. `feat(map): add facility panel (PROD-451)`. The production release finds issues in commit messages, and `ci.pr.yml` warns when the title has none.
- `ci.pr.yml` must pass: the branch-name check and the unit tests. The Linear-issue check only warns.
- Merge with **Squash and merge**.
- `cd.staging.yml` then deploys the branch head to **https://plei-market-health-map-staging.vercel.app**. Staging never bumps the version or creates a tag.
- Verify the change on staging before promoting it.

### 4. Promote `staging` into `main` with a **merge commit**

- Open a PR from `staging` into `main`. `staging` is the only branch allowed without a prefix, and only into `main`.
- Merge with **Create a merge commit**, never squash. Squashing rewrites staging's commits and makes the two branches diverge.
- `cd.production.yml` then:
  1. counts the non-merge commits since the last `vX.Y.Z` tag (see *Versioning and releases*);
  2. sets `version` in `package.json` and commits `ci: bump new version vX.Y.Z [skip ci]`;
  3. tags `vX.Y.Z` and pushes both to `main`;
  4. deploys that tag to **https://plei-market-health-map.vercel.app**.
- If no commit needs a bump (only `chore`, `refactor`, …), nothing is tagged and `main`'s head is deployed.

### 5. Merge `main` back into `staging`

Open a PR from `main` into `staging` and merge it with **Create a merge commit**. That brings the `ci: bump new version` commit into staging, so the version and history match on both branches and the next promotion has no conflicts.

### Hotfixes for production

Start `hotfix/<slug>` from `staging` and follow the same path (steps 2–5). Only branch from `main` in an emergency where staging holds work that must not ship. In that case, open the PR straight into `main` and back-merge `main` into `staging` right after.

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
