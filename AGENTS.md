# AGENTS.md

A guide for coding agents working in this repo. `CLAUDE.md` has the full architecture and code conventions. This file adds the rules for **where code goes** and for **git, branches, commits, and releases** that every agent must follow.

## Folder structure (where code goes)

Use this as the map before creating any file. If something doesn't fit, ask instead of inventing a new top-level folder.

```
apps/
  web/src/
    app/                          Next.js routing only: page.tsx, layout.tsx, route.ts, manifest.ts
    application/
      constants/                  UI constants shared across screens (brand-colors.ts, plei-logo.ts)
      test/                       test helpers and fixtures (messages, render-with-messages, query-wrapper)
    presentation/
      screens/<Name>Screen/       one screen per page (FacilitiesMapScreen, SignInScreen, OfflineScreen)
      components/<group>/<Name>/  reusable UI, grouped by kind: buttons/, displays/, layout/, map/, providers/
      hooks/use-<subject>/        hooks grouped by subject: use-facility/, use-app/, use-map/
    infrastructure/
      api/                        the fetch apiClient
      ai/browser-llm/             BrowserLlm (WebLLM engine) and its web worker
      ai/prompts/                 prompt builders (ActivitySummaryPrompt)
      cache/local-storage/<name>/ browser caches (ai-summary)
      activity/                   ActivityTracker: records visits, minutes and feature use for App metrics
      auth/                       Auth.js config, server actions, access checks
      i18n/                       request locale
    proxy.ts                      Next proxy (must stay at src/)
  server/src/
    presentation/http/            createApiApp (Hono), controllers/<resource>-controller.ts, auth guard, responses, errors
    presentation/auth/            inbound adapters called by web (trackSignIn)
    infrastructure/repositories/  repository implementations by source: database/, warehouse/, sample/
      <source>/<name>/            one folder per unit: <name>.ts, <name>.types.ts, __tests__/<name>.test.ts
    infrastructure/providers/     provider implementations: system/ (clock, ids), linear/ (issue tracker), same one-folder-per-unit layout
    container.ts                  composition root, the only place that builds concrete adapters
    env.ts                        server env parsing (Zod)
  server/prisma/                  schema and migrations
packages/
  core/src/
    domain/                       entities/<entity>/, shared/ (guard, errors, ids); imports nothing
    application/                  services/, repositories/ and providers/ (interfaces), dtos/, mappers/, errors/, testing/ (fakes); imports only domain
    i18n/                         message catalogs and locale helpers; imports nothing
  config/                         shared tsconfig and Vitest presets
.github/
  workflows/                      CI/CD workflows only (GitHub reads every YAML here)
  scripts/release/                scripts the workflows run (next-version, release-notes)
docs/                             repo-wide docs (architecture, conventions, deployment, design system)
```

Rules:

- **Pages stay thin.** A `page.tsx` renders one screen from `presentation/screens` and does nothing else beyond reading params or redirecting. Only Next.js files go in `app/`.
- **A screen is the page's content**, not a wrapper around one component. Pieces used by more than one screen go in `presentation/components/<group>/`.
- **Component folders** are PascalCase: `<Name>/<Name>Component.tsx` with `.rules.ts` (the `use<Name>Rules` hook holds all logic), `.types.ts`, optional `.styles.ts`, and tests in `__tests__/`. Screens follow the same shape (`<Name>ScreenComponent.tsx`).
- **Hooks** live in `presentation/hooks/use-<subject>/use-<subject>-<what>.ts` (e.g. `use-facility/use-facility-list-all.ts` exports `useFacilityListAll`). Data hooks wrap `infrastructure/api/apiClient` with React Query.
- **Infrastructure is grouped by technology**, then by purpose: `ai/`, `cache/local-storage/`, `api/`, `auth/`. Stateful services are classes with one shared instance exported next to them (`export const browserLlm = new BrowserLlm()`), and their dependencies are constructor options so tests pass fakes.
- **Server layers are controllers → services → repositories.** One Hono controller per resource in `presentation/http/controllers/<resource>-controller.ts`, mounted in `api-app.ts`; it only reads the request, calls a service and responds. Business logic lives in core `application/services/` as `makeVerbNoun`. Storage goes through an interface in core `application/repositories/`, implemented in server `infrastructure/repositories/<source>/`; other outside needs (clock, ids, Linear) are `application/providers/` implemented in `infrastructure/providers/`. `container.ts` is the only place that picks implementations, so changing the database never touches controllers or services.
- **One folder per server unit.** Every repository, provider and helper in `apps/server/src/infrastructure` lives in a folder named after it, with its types and tests beside it:

  ```
  infrastructure/repositories/warehouse/warehouse-facility-repository/
    warehouse-facility-repository.ts
    warehouse-facility-repository.types.ts
    __tests__/warehouse-facility-repository.test.ts
  ```

  Import the file by its full path (`@server/infrastructure/repositories/warehouse/warehouse-facility-repository/warehouse-facility-repository`). Its `.types.ts` carries the same name as the file, and supporting data belongs to its unit (the sample CSV lives in `fixture-app-session-heatmap-repository/fixtures/`).
- **Core stays framework-free.** Biome's `noRestrictedImports` blocks wrong imports (domain → application, core → apps, React, Next, Hono, Prisma). New entities go in `domain/entities/<entity>/`, new services in `application/services/` as `makeVerbNoun`.
- **Tests** go in a `__tests__/` folder beside the file they cover, named `<file>.test.ts(x)`. Shared helpers go in `application/test/` (web), `testing/` (server) or `application/testing/` (core fakes).
- **Types** go in a sibling `<file>.types.ts`, never inline.
- **Imports** use aliases only: `@/…` in web, `@server/…` in server, `@core/…` in core, and `@market-health-map/core/<domain|application|i18n>` or `@market-health-map/server` across packages.
- **Names:** folders and files are kebab-case, except component and screen folders, which are PascalCase.

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

Only **production** is versioned. `.github/scripts/release/next-version.mjs` (tests in `next-version.test.mjs`, run by `pnpm test:scripts`) reads the non-merge commits since the last `vX.Y.Z` tag and counts them:

| Commit | Effect |
| --- | --- |
| `feat:` / `feature:` | **+1 minor** for each commit (patch resets) |
| `fix:` / `hotfix:` | **+1 patch** for each commit |
| `type!:` or `BREAKING CHANGE` | **+1 major** (minor and patch reset) |
| `refactor`, `chore`, `docs`, … | no bump |

Merge commits are skipped, so a squashed PR counts once and a merged PR counts its own commits, never the merge on top. For example, `v0.1.1` followed by one feature and one hotfix gives `v0.2.1`.

On a push to `main`, `_release.yml` sets `version` in the root `package.json`, commits it as `ci: bump new version vX.Y.Z [skip ci]`, creates an annotated tag, and pushes both. `_deploy-vercel.yml` then deploys **that tag**. If nothing needs a bump, nothing is tagged and `main`'s head is deployed. `staging` never bumps or tags. Never edit `version` by hand.

After a tagged deploy, the `linear-release` job writes release notes with `.github/scripts/release/release-notes.mjs` (tests in `release-notes.test.mjs`). The notes cover the commits since the previous stable tag, grouped into Breaking changes, Features, Fixes and Other changes, plus every Linear issue ID they mention. The job then creates a release in the **Market Health Map** Linear pipeline with `linear/linear-release-action`: the version is the tag, the notes are attached as the release notes and as a `Changelog vX.Y.Z` document, and the referenced issues are linked. The notes also go to the job summary. Without the `LINEAR_ACCESS_KEY` secret, the job only warns. It then moves every `ENG`/`PROD` ticket the notes mention to **Released**. A promotion squash-merged into `main` still bumps the version, because `next-version.mjs` reads the commit list in its body.

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
- End the title with the Linear issue, e.g. `feat(map): add facility panel (ENG-5758)`. The production release finds issues in commit messages, and `ci.pr.yml` warns when the title has none. PRs are squash-merged, so only the title survives: when a PR covers more than one ticket, name every one of them in the title, e.g. `(ENG-5805, ENG-5806)`, or the others won't be in the release.
- `ci.pr.yml` must pass: the branch-name check and the unit tests. The Linear-issue check only warns.
- Review it in Linear if you like: open `linear.review/lucasArena/plei-market-health-map/pull/<number>` (or the **Reviews** tab). `.gitattributes` groups the diff into implementation, tests, docs, agent guidance, localization, assets and generated files.
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

## Feature flags

Put user-facing work behind a feature flag when it should reach `staging` or `main` before everyone gets it, or when it might need to be switched off quickly. A flag is on or off for everyone, and admins switch it at `/feature-flags` (account hub → Feature flags) without a deploy.

**Adding a flag**

1. Add a kebab-case key to `FEATURE_FLAG_KEYS` in `packages/core/src/application/dtos/feature-flags-dto.ts`. Flags only exist in code; the control panel can switch them but never create them.
2. Describe it in `featureFlags.descriptions` in `packages/core/src/i18n/messages/en.ts`, `pt-BR.ts` and `es.ts`. `packages/core/src/__tests__/feature-flag-descriptions.test.ts` fails if a key has no description or a description has no key.
3. Read it in the component's `.rules.ts` hook with `useFeatureFlag("<key>")` from `presentation/hooks/use-feature-flags/use-feature-flags.ts`, and render the new behavior only when it is `true`. Keep the current behavior working when it is `false`, which is also the answer while the flags load. Server code can call `listEnabledFeatureFlags()` from the container.
4. Test both states by mocking `useFeatureFlag`.
5. A new flag starts **off**. Say in the PR which flag to turn on, and leave turning it on to an admin.
6. Add the **`feature flag`** label to the Linear ticket. While a ticket has it, production releases leave its commits out of the release notes and the Linear release, and it doesn't move to Released (`release-notes.mjs` and `flagged-issues.mjs` in `cd.production.yml`).

Switches reach users within about a minute: the server caches the flags for 30 seconds and each browser refetches them after 30 seconds.

**Removing a flag** (once it is on for everyone and staying on)

1. Delete every `useFeatureFlag("<key>")` check and the old behavior, keeping only the "on" path.
2. Remove the key from `FEATURE_FLAG_KEYS` and its descriptions from every catalog.
3. Leave the database row. Rows for keys that are no longer in code are ignored and disappear from the control panel.
4. Name the removed flag in the PR title or description.
5. Remove the `feature flag` label from the tickets the flag covered. Work that shipped while it was flagged is not added to a release later on its own; move those tickets to Released by hand once the flag is fully on.

## Linear tracking (mandatory)

Every piece of agent work is tracked in a Linear ticket, including work that starts in a chat instead of a ticket. Nobody should have to add tickets by hand to keep a record of what agents did. The ticket and the PR description are also the project's record of how agents were used (a project must-have), so say in the PR which agent did the work and how you verified it. There is no separate log file.

1. **Find or create the ticket before you change code.** Use the ticket you were given. If there is none, look for a matching one in the **Market health map** project. If nothing fits, create one in the **Engineering** team (`ENG`), in that project, assigned to the person you are working for.
2. **Set it to In Progress** while you work.
3. **Open the PR and attach its link to the ticket** so the diff shows up there. Put the ticket ID in the branch slug (`feature/eng-5796-<slug>`) and at the end of the PR title (see *Release workflow*).
4. After that, GitHub moves it for you (`linear-sync.yml` and `cd.production.yml`, through `.github/scripts/linear/move-issues.mjs`): **Code Review** when a PR into `staging` opens or gets new commits (drafts wait until ready for review; GitHub skips PRs with merge conflicts until they are pushed again), **Feedback** when a reviewer requests changes, **Done** when the PR merges into `staging`, and **Released** when a tagged production deploy ships it. Only `ENG` and `PROD` tickets found in the PR title, branch or release commits move; `REQ` tickets never do.

Reach Linear through the Linear MCP server in your agent client, or the GraphQL API (`https://api.linear.app/graphql`) with your own API key from your environment. Never commit keys or paste them into tickets, PRs or logs. The app's `LINEAR_CLIENT_ID` and `LINEAR_CLIENT_SECRET` are for in-app feedback and the GitHub workflows above, not for agent logging. If you can't reach Linear, tell the person you are working for.

## Before you finish a task

- `pnpm check` passes.
- New files follow the folder structure above, and docs in `CLAUDE.md` and `docs/` match what changed.
- The Linear ticket is linked to the PR and has the right status.

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
