# Agent usage log

The project requires documenting how agents were used. Add an entry for each meaningful piece of agent-assisted work.

| Date | Agent | Task | Outcome |
| --- | --- | --- | --- |
| 2026-09-28 | Claude Code (Opus 5.5) | Scaffolded the monorepo with the `project-starter` skill, ported the PleiOS Clerk sign-in, and built the login-tracking slice end to end | Lint, typecheck, and build pass; 100% unit coverage |
| 2026-09-28 | Claude Code (Opus 5.5) | Added the market health heat map (MapLibre heat layer plus health-colored markers, a metric toggle, and a sample market repository) | 100% coverage; production build passes |
| 2026-09-28 | Claude Code (Opus 5.5) | Made the map full-screen, fixed the MapLibre height and worker bugs (switched to v5), and added the market detail panel (indicators, facility list with avatars, skeleton) | Checked visually with headless Playwright; 100% coverage |
| 2026-09-28 | Claude Code (Opus 5.5) | Replaced the sample cities with the 45 real Plei regions (internal and test regions excluded), added the `inactive` status, and fixed the facility distribution | Checked visually with headless Playwright |
| 2026-09-28 | Claude Code (Opus 5.5) | Built CI/CD: PR CI, plus `ci.staging.yml` (main → staging) and `ci.production.yml` (tag → production), on a reusable Vercel deploy job with Neon migrations | actionlint clean; local `vercel build` succeeds |
| 2026-09-28 | Claude Code (Opus 5.5) | Fixed the `pnpm audit` CI failure (MapLibre v6 with a self-hosted worker, plus pnpm overrides). Added the Needs attention panel (ranked, minimizable), rebuilt the market panel (status, description, weekly confirmation-rate and games charts, locations), moved attribution into the legend, and made the header logo-only | Checked visually with headless Playwright; audit clean; 100% coverage |
| 2026-09-28 | Claude Code (Opus 5.5) | Stripped the app to a map-only view: floating logo and avatar, one dot per mock facility. Removed the panels, heat layer, charts and adoption page. Logged PROD-442, PROD-443 and PROD-444 in Linear | Checked visually with headless Playwright; 100% coverage |
| 2026-09-28 | Claude Code (Opus 5.5) | Added the facility hover card (logo and name) and the click-to-open right panel. Fixed an invalid MapLibre selection expression the mocked tests missed, and added a style-spec validation test | Checked visually with headless Playwright; 100% coverage |
| 2026-09-28 | Claude Code (Opus 5.5) | Set up the staging/main git flow, commitlint on the hook and on PRs, and automated releases (bump, changelog, tag, then production deploy) on merge to `main`. Wrote `AGENTS.md` | actionlint clean; local release dry run |
