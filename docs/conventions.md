# Conventions

## Code

- English only. No comments. Names, types, and tests document intent.
- Every `interface` and `type` lives in a `*.types.ts` file next to the code that uses it.
- No nested ternaries. For more than one condition, use `{ [`${low}`]: a, [`${high}`]: b }.true`; the last key that is true wins.
- Path aliases only: `@/*` in apps, and `@domain/*`, `@application/*`, `@infra/*`, `@i18n/*` inside packages. Use `@market-health-map/<pkg>` across packages.
- Named exports only, except Next.js route segments (`page`, `layout`, `manifest`).
- Use-case factories follow `makeVerbNoun(deps)`, which returns a `verbNoun(input)` function.
- Entities have a private constructor, `create()` (validates), `restore()` (rehydrates), getters, and `toJSON()`.
- React components: one PascalCase folder each, `NameComponent.tsx`, with `.types.ts`, `.rules.ts` (hook with all the logic) and `.test.tsx` beside it.
- Biome formats: tabs, double quotes, semicolons, width 100.

## Testing

- Tests sit next to the code as `*.test.ts(x)`. Coverage must reach 95% on lines, branches, functions, and statements in every package.
- Domain tests are pure. Application tests use the in-memory fakes. Web tests use Testing Library, and external modules (Clerk, the container, `fetch`) are mocked.
- Prisma repositories are covered by `*.integration.test.ts`, run with `pnpm --filter @market-health-map/infrastructure test:integration` against a Neon branch. They are excluded from the unit coverage gate.

## Git

- Conventional commits, enforced by commitlint on `commit-msg`.
- Pre-commit runs `lint-staged` (Biome on staged files). Pre-push runs `pnpm check`.
- Branch from `main` and open PRs against `main`. CI runs lint, typecheck, coverage, build, and audit.
