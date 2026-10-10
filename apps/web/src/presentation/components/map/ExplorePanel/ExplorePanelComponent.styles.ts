import { PLEIFUL_COLORS } from "@/application/constants/brand-colors";
import { SOFT_GLASS_CLASS } from "@/presentation/components/map/MapMetricSelect/MapMetricSelectComponent.styles";
import { MARKET_SUMMARY_PANEL_CLASS } from "@/presentation/components/map/MarketSummaryPanel/MarketSummaryPanelComponent.styles";

export const DRILL_DOWN_COLORS = {
	magic: PLEIFUL_COLORS.moonlight[50],
	organizers: PLEIFUL_COLORS.sky[50],
	partnerships: PLEIFUL_COLORS.pitchGreen[40],
};
export const DRILL_DOWN_ORGANIZER_COLORS = [
	PLEIFUL_COLORS.sky[50],
	PLEIFUL_COLORS.moonlight[50],
	PLEIFUL_COLORS.pitchGreen[40],
	PLEIFUL_COLORS.orchid[50],
	PLEIFUL_COLORS.sangria[50],
	PLEIFUL_COLORS.informative[50],
];
export function drillDownOrganizerColor(index: number): string {
	return (
		DRILL_DOWN_ORGANIZER_COLORS[index % DRILL_DOWN_ORGANIZER_COLORS.length] ??
		PLEIFUL_COLORS.sky[50]
	);
}
export const DRILL_DOWN_FACILITY_SEGMENT_LIMIT = DRILL_DOWN_ORGANIZER_COLORS.length;
export const DRILL_DOWN_OTHER_FACILITIES_COLOR = PLEIFUL_COLORS.neutral[40];
export function drillDownFacilityColor(index: number): string {
	return index >= 0 && index < DRILL_DOWN_FACILITY_SEGMENT_LIMIT
		? drillDownOrganizerColor(index)
		: DRILL_DOWN_OTHER_FACILITIES_COLOR;
}
export const DRILL_DOWN_PANEL_CLASS = MARKET_SUMMARY_PANEL_CLASS;
export const DRILL_DOWN_EXPAND_BUTTON_CLASS = `${SOFT_GLASS_CLASS} flex size-7 shrink-0 cursor-pointer items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary`;
export const DRILL_DOWN_BAR_CLASS =
	"group relative min-h-[2px] w-full shrink-0 cursor-pointer bg-[linear-gradient(90deg,rgb(255_255_255/0.22)_0%,rgb(255_255_255/0.06)_35%,rgb(255_255_255/0)_60%)] shadow-[inset_0_1px_0_rgb(255_255_255/0.55),inset_0_0_0_1px_rgb(255_255_255/0.22)] transition-[opacity,filter] hover:z-10 hover:opacity-90 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary aria-pressed:brightness-110";
export const DRILL_DOWN_BAR_TOP_CLASS = "rounded-t-[5px]";
export function drillDownGlassColor(color: string): string {
	return `color-mix(in srgb, ${color} 92%, transparent)`;
}
/**
 * Expanded is a focus view over the whole viewport, like Linear's. Same glass surface as the
 * docked panel; `animateExplorePanelResize` grows the box between the two.
 */
export const DRILL_DOWN_EXPANDED_PANEL_CLASS =
	"pointer-events-auto fixed inset-0 z-[60] flex h-dvh w-screen flex-col overflow-hidden map-glass rounded-none border-0 shadow-[var(--map-shadow)]";
export const DRILL_DOWN_BACK_TO_MAP_BUTTON_CLASS = `${SOFT_GLASS_CLASS.replace("aria-pressed:text-foreground", "aria-pressed:text-foreground/60")} flex h-7 shrink-0 cursor-pointer items-center gap-1.5 px-2.5 text-xs font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary`;
export const DRILL_DOWN_CHART_HEIGHT_CLASS = {
	docked: "h-52",
	expanded: "h-[clamp(20rem,45dvh,36rem)]",
};
/** Apple-like ease for the expand and collapse resize. */
export const DRILL_DOWN_RESIZE_EASING = "cubic-bezier(0.32, 0.72, 0, 1)";
export const DRILL_DOWN_RESIZE_MS = 360;

export const DRILL_DOWN_SKELETON_CLASS =
	"animate-pulse rounded bg-foreground/[0.07] motion-reduce:animate-none";

/** Chart pieces shared with the insight panel's games line chart. */
export const CHART_GRIDLINE_CLASS =
	"absolute inset-x-0 border-t border-dashed border-foreground/15";
export const CHART_TICK_LABEL_POSITION_CLASS =
	"absolute -right-9 -translate-y-1/2 w-7 text-right tabular-nums text-muted-foreground";
/**
 * Glass tooltip surface used by the insight panel tooltips: the panels' own
 * map-glass (65% background tint, 18px blur, 1.5 saturation), the panel border
 * and map shadow, 6px radius, 11px foreground text (~19:1 over the white panel).
 */
export const GLASS_TOOLTIP_SURFACE_CLASS =
	"map-glass rounded-md border border-border px-2 py-1 text-[11px] text-foreground shadow-[var(--map-shadow)]";
export const CHART_TOOLTIP_CLASS = `pointer-events-none absolute bottom-full z-20 mb-2 whitespace-nowrap opacity-0 ${GLASS_TOOLTIP_SURFACE_CLASS}`;

/** Drill-down table tokens, shared with the insight panel's Markets and Facilities lists. */
export const DRILL_DOWN_TABLE_HEADER_CELL_CLASS = "py-2";
export const DRILL_DOWN_TABLE_HEADER_TEXT_CLASS = "font-bold text-foreground";
export const DRILL_DOWN_TABLE_NUMBER_CELL_CLASS = "text-right tabular-nums";
