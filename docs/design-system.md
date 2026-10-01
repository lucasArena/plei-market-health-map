# Design system

The Pleiful color system comes from the Figma Foundations file. The codebase exposes it in two forms:

- TypeScript consumers import `PLEIFUL_COLORS` from `@/application/constants/brand-colors` in `apps/web`.
- CSS and Tailwind consumers use utilities such as `bg-pleiful-pitch-green-50`,
  `text-pleiful-moonlight-70`, or the matching `--pleiful-*` custom properties.

Use semantic application tokens such as `primary`, `muted`, and `destructive` for standard interface
elements. Use the named Pleiful scales for charts, maps, branded illustrations, or other places where a
specific palette value carries meaning.

The TypeScript constants retain uppercase Figma hex values for APIs such as MapLibre that cannot resolve
CSS custom properties. The CSS values are the same tokens exposed through Tailwind v4's theme layer.

## Glass surfaces

The map chrome shares the glass finish of the facility cluster circles. The tokens live in
`apps/web/src/app/globals.css` as `--glass-*` custom properties, with light values in `:root` and dark
values in `.dark`. They mirror the `CLUSTER_GLASS_*` constants in
`FacilitiesMapScreenComponent.styles.ts`, a notch glassier: a 24px blur with 2x saturation, a white
top highlight gradient, a soft white rim, and an inset top light over a soft drop shadow.

Three Tailwind utilities apply them. Only the fill changes between tiers:

| Utility | Fill (light) | Fill (dark) | Use it for |
| --- | --- | --- | --- |
| `glass` | white at 42% | near black at 45% | Small icon controls: the summary toggle, the avatar, the zoom buttons |
| `glass-strong` | white at 60% | near black at 68% | Controls with text: the search field and its results list |
| `glass-panel` | white at 74% | near black at 78% | Dense panels and drawers: the facility detail panel and the market summary drawer |

`glass-strong` and `glass-panel` also swap `--muted-foreground` for `--glass-muted-foreground`, a darker
gray (lighter in the dark theme), so secondary text keeps at least 4.5:1 contrast on the translucent
fill, even over the purple session heatmap. The dark fills stay higher than the light ones because the
basemap stays light in the dark theme. Add shape and spacing classes next to the utility, for example `glass rounded-full` or
`glass-panel rounded-2xl`. Don't add `border`, `bg-*`, `shadow-*` or `backdrop-blur-*`, since the utility
sets them. Focus rings (`ring-*`) still work on top of the glass shadow.

With `prefers-reduced-transparency: reduce`, every tier falls back to a solid `--background` surface
with the regular border and no blur.

MapLibre's zoom control is styled through its own classes (`.maplibregl-ctrl-group`) in `globals.css`,
so MapLibre still wires the buttons.
