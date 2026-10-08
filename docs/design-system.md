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

The map layers menu is a Demand / Supply tree divided by a thin border. Each section is a label with a visibility switch; turning the switch on reveals nested radio options, Add filter trees, and Show trend / Show inactive facilities below that row. App sessions and Active facilities start enabled; Inactive facilities starts disabled. Supply filtering uses the existing facility `isActive` value before clustering, so cluster counts and previews reflect visible facilities. When any setting differs from its default, a footer inside the same glass card, under a thin `border-border` divider, shows a right-aligned Reset text button (`text-xs`, muted, no fill) that restores the defaults. The footer is not rendered with the defaults.

While app sessions load, the session legend shows the heatmap gradient at 40% opacity, pulsing (`motion-safe` only), above "Loading app sessions…" in 10px muted text. It replaces the scale until data arrives, so the empty map never reads as "no sessions".
When `player-demographic-filters` is enabled, the layers menu is 280px wide and scrolls within the available viewport. Applied filters appear as removable chips under the Demand metrics. Add filter stays under that list and is shown only while the Demand layer is on. It opens Gender, Player skill level, and Player age as submenus. Player age takes an optional minimum and maximum. Apply filter is a 5% black button with a black label at the bottom once a choice is selected; it commits the choice and closes the panel. Empty results, loading, and failures for those filters appear in the session reference panel.

Age filters offer optional minimum and maximum whole-year inputs (0–120) without preset shortcuts. Blank bounds are unlimited; reversed ranges block Apply.

Gender and skill menus support multiple checked choices and remain open while selecting. Values within each field match with OR; separate fields combine with AND.

Skill choices follow Beginner, Intermediate, Advanced, Expert progression while retaining warehouse-backed values.

Cluster circles follow map projection immediately during camera movement. Only hover scale animates; geographic positions must never ease behind a drag.

Glass circles synchronize inside the map render callback, without scheduling another animation frame, so overlays and the map paint together.
Games trend markers use a translucent glass circle with a 35px activity ring inset in a 41px glass disc. A 16px white circular badge overlaps the top-right edge, carrying a rounded green upward arrow, red downward arrow, or gray rightward arrow for unchanged counts. The 12px semibold count remains centered and the badge stays pointer-transparent.

Trend-enabled clusters and individual games markers share a 45px marker box and identical ring geometry, giving abbreviated counts more space and avoiding size changes between grouped and individual markers.

Games trends use the same vivid pastel green as the default outline (`success[30]`) for growth, paired with coral red (`negative[40]`) for decline. Directional tips distinguish them beyond color. A facility or cluster with games in the previous period and zero now remains visible as declining, rather than a neutral dotted zero.

Hover cards always report the actual game-count change, including small increases and decreases. Equal counts say unchanged, with the comparison period, instead of about the same.

Games trend direction follows every count change without percentage or minimum-game thresholds: any increase is green/up, any decrease is red/down, and exactly equal counts are gray/rightward. Hover text reports the count difference.

Games trend information appears on map markers and hover cards. The facility detail panel does not display a separate games trend card.

Layer sub-controls are visible only while their parent toggle is on: player filters follow Demand, and Department, Show trend and Show inactive facilities follow Supply. Applied settings are retained when controls are hidden.

Count marker rings follow facility activity in both trend states: active facilities use green and inactive facilities use gray; clusters use green when any member is active. Show inactive facilities uses the same text size and weight as Show trend.

Active and inactive count circles use the exact 35px ring assets from Figma nodes 21038:2078 and 21038:2082, with the white translucent overlay above the vertical glass highlight. Count typography remains at the user-preferred 12px in both trend states.

The stable trend arrow is the same 12px arrow geometry as the upward icon, rotated right and colored gray, with the same 1.33px rounded stroke.

MapMetricSelect uses the filter menu glass surface, checkmarks and keyboard navigation. MapScopeProvider carries metric focus and explicit camera navigation separately from shared scope; SidePanelProvider supports the exclusive drill-down panel ID. Existing panel offsets share consistent glass positioning.
