# Web app agent guidance

## Light and dark mode (mandatory)

- Every new or modified component must support both light and dark mode. Treat both themes as part of the implementation, including loading, empty, error, hover, focus, selected and disabled states.
- Follow the user's system preference through the existing `useSystemTheme` hook and app-wide `.dark` theme. Do not introduce a separate theme preference or manual switch unless explicitly requested.
- Prefer the semantic color and glass tokens in `src/app/globals.css` (`background`, `foreground`, `card`, `popover`, `muted`, `border`, and `--glass-*`). When a fixed color is necessary, provide an appropriate dark variant. Check icons, charts, health indicators, overlays and DOM map markers as well as component surfaces and text.
- Keep existing light-mode behavior and appearance working. Verify new or changed UI in both system themes and after a live system-theme change; check readability, contrast and interaction states. Add regression tests when theme changes affect behavior, such as restoring map layers or images.
- Follow `docs/design-system.md` for the shared theme and map styling conventions.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
