# Design system

The Pleiful color system comes from the Figma Foundations file. The codebase exposes it in two forms:

- TypeScript consumers import `PLEIFUL_COLORS` from `@/lib/design-system/brand-colors`.
- CSS and Tailwind consumers use utilities such as `bg-pleiful-pitch-green-50`,
  `text-pleiful-moonlight-70`, or the matching `--pleiful-*` custom properties.

Use semantic application tokens such as `primary`, `muted`, and `destructive` for standard interface
elements. Use the named Pleiful scales for charts, maps, branded illustrations, or other places where a
specific palette value carries meaning.

The TypeScript constants retain uppercase Figma hex values for APIs such as MapLibre that cannot resolve
CSS custom properties. The CSS values are the same tokens exposed through Tailwind v4's theme layer.
