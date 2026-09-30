# Conventions

## Code

- English only. No comments. Names, types, and tests document intent.
- Every `interface` and `type` lives in a `*.types.ts` file next to the code that uses it.
- No nested ternaries. For more than one condition, use `{ [`${low}`]: a, [`${high}`]: b }.true`; the last key that is true wins.
- Path aliases only: `@/*` in web, `@server/*` in server, `@core/*` in core. Across packages, use `@market-health-map/core/<domain|application|i18n>` and `@market-health-map/server`.
- Named exports only, except Next.js route segments (`page`, `layout`, `manifest`).
- Services (`application/services/`) follow `makeVerbNoun(deps)`, which returns a `verbNoun(input)` function. Controllers call them; repositories and providers are passed in as `deps`.
- Entities have a private constructor, `create()` (validates), `restore()` (rehydrates), getters, and `toJSON()`.
- Pages in `src/app` stay thin and render one screen from `src/presentation/screens/` (`FacilitiesMapScreen`, `SignInScreen`, `OfflineScreen`). Screens compose the components in `src/presentation/components/`.
- React components: one PascalCase folder each, `NameComponent.tsx`, with `.types.ts` and `.rules.ts` (hook with all the logic) beside it, and its tests in `__tests__/`.
- Biome formats: tabs, double quotes, semicolons, width 100.

## Testing

- Tests live in a `__tests__/` folder beside the code they cover (`src/foo/__tests__/bar.test.ts` tests `src/foo/bar.ts`). Coverage must reach 95% on lines, branches, functions, and statements in every package.
- Domain tests are pure. Application tests use the in-memory fakes. Server API tests call the Hono app with `app.request()` and fake services. Web tests use Testing Library, and external modules (Auth.js, the server package, `fetch`) are mocked.
- Prisma repositories are covered by `*.integration.test.ts`, run with `pnpm --filter @market-health-map/server test:integration` against a Neon branch. They are excluded from the unit coverage gate.

## Git

The full rules live in [`AGENTS.md`](../AGENTS.md). In short:

- Branch from `staging` as `feature/…`, `hotfix/…`, `refactor/…` or `chore/…`, open a PR into `staging`, then promote with a PR from `staging` into `main`. Never push to either directly.
- Conventional commits (`feat | fix | chore | docs | style | refactor | perf | test | build | ci | revert`), enforced by commitlint in the `commit-msg` hook.
- `pre-commit` runs lint-staged (Biome), and `pre-push` runs `pnpm check`.
- A push to `staging` deploys staging. A push to `main` bumps the version from the commits since the last tag (+1 minor per feature, +1 patch per hotfix), commits `ci: bump new version …`, tags, and deploys that tag to production.
