import type { GamesMetricToneValue } from "@/presentation/components/displays/GamesMetricsList/GamesMetricsListComponent.types";
import {
	CHANGE_BADGE_CLASS,
	CHANGE_BADGE_TONE_CLASS,
	INSIGHT_CONTAINER_CLASS,
	METRIC_LABEL_LEADING_CLASS,
	METRIC_VALUE_CLASS,
	MODULE_ROW_DIVIDER_CLASS,
} from "@/presentation/components/displays/StatTiles/StatTilesComponent.styles";
import {
	CHART_TOOLTIP_CLASS,
	DRILL_DOWN_COLORS,
} from "@/presentation/components/map/MetricDrillDownPanel/MetricDrillDownPanelComponent.styles";

/**
 * The whole Games module (label, number, pill, comparison, chart and rows) sits
 * in one subtle container: 3% foreground tint on the panel with a 6% hairline
 * border, a 10px radius and 12px padding. #525866 text stays about 6.6:1 on the
 * tint. No overflow clipping, so chart tooltips can extend past the padding.
 */
export const GAMES_METRICS_CARD_CLASS = `flex flex-col gap-4 ${INSIGHT_CONTAINER_CLASS}`;

/** 7:1 on the 90% white card; replaces the design's 60%-alpha greys, which fail AA. */
export const GAMES_METRICS_SECONDARY_TEXT_CLASS = "text-[#525866] dark:text-muted-foreground";

/**
 * Sizes follow MetricDrillDownPanel (root font-size is 14px, so rem utilities scale with it).
 * Captions use 11px instead of the drill-down's text-xs (10.5px) to stay at or above 11px.
 */
export const GAMES_METRICS_CAPTION_TEXT_CLASS = "text-[11px]";

/** The shared change badge. */
export const GAMES_METRICS_PILL_CLASS = CHANGE_BADGE_CLASS;

/** Rows inside the module container: spacing only (8px), no dividers or inner box. */
/**
 * Rows split by the shared MODULE_ROW_DIVIDER_CLASS (on each row). The old 8px gap
 * is split around the divider: 4px margin above, and 7px top padding below (1px
 * divider + 6px) instead of the row's 2px. div+div outranks the row's py-[2px].
 */
export const GAMES_METRICS_LIST_CLASS = "flex flex-col [&>div+div]:mt-[4px] [&>div+div]:pt-[7px]";

/** 13px label + 3px gap + 18px value = 34px per row. */
export const GAMES_METRICS_ROW_CLASS = `grid grid-cols-[minmax(0,1fr)_76px] items-center gap-x-3 gap-y-[3px] py-[2px] ${MODULE_ROW_DIVIDER_CLASS}`;

/** Title (metric label style) sits 3px above the big number, like the tile labels. */
export const GAMES_METRICS_TITLE_GROUP_CLASS = "flex flex-col gap-[3px]";

/** 11px label, tightened to a 13px line (shared with the compact tiles). */
export const GAMES_METRICS_ROW_LABEL_LEADING_CLASS = METRIC_LABEL_LEADING_CLASS;

/** 11px value (same size as the grey comparison) on an 18px line (shared with the compact tiles). */
export const GAMES_METRICS_ROW_VALUE_CLASS = METRIC_VALUE_CLASS;

/** The shared badge tones (glassy tint; contrast in CHANGE_BADGE_TONE_CLASS). */
export const GAMES_METRICS_TONE_CLASS: Record<GamesMetricToneValue, string> =
	CHANGE_BADGE_TONE_CLASS;

/** The drill-down's green token (pitch-green-40, #3D8C77), 4:1 on white. */
export const GAMES_CHART_LINE_COLOR = DRILL_DOWN_COLORS.partnerships;

/** Full-height column per week: a large hover/click target around each dot. */
export const GAMES_CHART_HIT_CLASS =
	"group absolute top-0 h-full z-[1] -translate-x-1/2 cursor-pointer hover:z-10 focus-visible:z-10 focus-visible:outline-none";

/** Dot grows and gets a ring on hover and keyboard focus. */
/**
 * Zero-size anchor at the line vertex (left 50% of the hit target, which is
 * centered on xPercent; top = topPercent of the same plot box as the SVG).
 */
export const GAMES_CHART_VERTEX_CLASS = "absolute left-1/2 size-0";

/** Centered on the vertex anchor: top/left 0, then −50% on both axes. */
export const GAMES_CHART_DOT_CLASS =
	"absolute top-0 left-0 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white dark:border-border shadow-[0_0_0_1px_rgba(0,0,0,0.08)] transition-transform group-hover:scale-125 group-focus-visible:scale-125 group-focus-visible:ring-2 group-focus-visible:ring-primary group-focus-visible:ring-offset-1";

/** 25% shorter than the drill-down's h-52 (208px) plot. Gridlines, points and tooltips are %-based. */
export const GAMES_CHART_PLOT_CLASS = "relative h-[117px]";

/**
 * Drill-down tooltip look without its fixed "above" placement: the 117px plot is
 * shorter than a tooltip, so placement flips per point (see tooltipPlacement).
 */
export const GAMES_CHART_TOOLTIP_CLASS = CHART_TOOLTIP_CLASS.split(" ")
	.filter((token) => token !== "bottom-full" && token !== "mb-2")
	.join(" ");

/** Drill-down's 10px tick and axis labels, bumped to 11px for this chart only. */
export const GAMES_CHART_LABEL_TEXT_CLASS = "text-[11px]";

/** Tooltip change text on the glass tooltip over the white panel: worse #b91c1c (6.5:1), better #166534 (7.1:1). */
export const GAMES_CHART_CHANGE_TEXT_CLASS: Record<GamesMetricToneValue, string> = {
	worse: "text-[#b91c1c] dark:text-red-300",
	better: "text-[#166534] dark:text-green-300",
	flat: GAMES_METRICS_SECONDARY_TEXT_CLASS,
};

/**
 * Line, dots and labels span the full plot width, inset only 10px on each side:
 * half of a hovered dot (10px at 1.25x) plus its 2px focus ring and 1px offset.
 */
export const GAMES_CHART_POINTS_CLASS = "absolute inset-y-0 inset-x-[10px]";

export const GAMES_CHART_X_LABELS_CLASS = "relative mt-2 h-4";

/** Placeholders for a row that is still loading (value, then pill), sized like the real content. */
export const GAMES_METRICS_PENDING_VALUE_CLASS =
	"h-[18px] w-16 animate-pulse rounded-[4px] bg-foreground/[0.06] motion-reduce:animate-none";
export const GAMES_METRICS_PENDING_PILL_CLASS =
	"h-[16px] w-10 animate-pulse rounded-full bg-foreground/[0.06] motion-reduce:animate-none";
