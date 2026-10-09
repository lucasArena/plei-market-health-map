import {
	CHANGE_BADGE_TONE_CLASS,
	INSIGHT_CONTAINER_CLASS,
	MODULE_ROW_DIVIDER_CLASS,
} from "@/presentation/components/displays/StatTiles/StatTilesComponent.styles";
import type { StatDirection } from "@/presentation/components/map/FacilityDetailPanel/FacilityDetailPanelComponent.types";
import { MAP_SEARCH_OPTION_HOVER_CLASS } from "@/presentation/components/map/MapSearch/MapSearchComponent.styles";
import {
	DRILL_DOWN_TABLE_HEADER_CELL_CLASS,
	DRILL_DOWN_TABLE_HEADER_TEXT_CLASS,
	DRILL_DOWN_TABLE_NUMBER_CELL_CLASS,
} from "@/presentation/components/map/MetricDrillDownPanel/MetricDrillDownPanelComponent.styles";

/**
 * Hover/focus of the map cluster card rows and the search results
 * (MAP_SEARCH_OPTION_HOVER_CLASS: bg-foreground/[0.07] on hover and focus, with the
 * cluster card's 6px radius). Their focus:outline-none is swapped for a visible
 * keyboard outline, so focus stays visible on these rows.
 */
export const MODULE_ROW_HOVER_CLASS = [
	"cursor-pointer rounded-[6px] transition-colors",
	...MAP_SEARCH_OPTION_HOVER_CLASS.split(" ").filter((token) => token !== "focus:outline-none"),
	"focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary",
].join(" ");

/** Same container as the Games module (tint, hairline, 10px radius, 12px padding). */
export const MARKET_LIST_CARD_CLASS = `flex flex-col gap-3 ${INSIGHT_CONTAINER_CLASS}`;

/**
 * Drill-down table look: rows pull out by the drill-down's pl-3 cell padding so
 * text lines up with the section title. 11px everywhere (the drill-down's
 * text-xs is 10.5px, below the panel's 11px minimum).
 */
export const MARKET_LIST_BODY_CLASS =
	"-mx-3 flex flex-col text-[11px] [--module-row-divider-inset:0.75rem]";

/** Drill-down header cells and text, without its header divider (no border-b under the header). */
export const MARKET_LIST_HEADER_ROW_CLASS = `flex items-center gap-2.5 pr-2 pl-3 ${DRILL_DOWN_TABLE_HEADER_CELL_CLASS} ${DRILL_DOWN_TABLE_HEADER_TEXT_CLASS}`;

/** Right-aligned tabular numbers, as in the drill-down value column. */
export const MARKET_LIST_NUMBER_CELL_CLASS = `w-12 shrink-0 text-foreground ${DRILL_DOWN_TABLE_NUMBER_CELL_CLASS}`;

export const MARKET_LIST_SECONDARY_TEXT_CLASS = "text-[#525866]";

/**
 * Drill-down row: square, soft hover tint and primary focus outline. Two text lines
 * (11px/16px name + 11px/14px status), so py-1.5 keeps rows about the drill-down's
 * one-line height (40px vs 37px) instead of its py-3.
 */
/** Drill-down row padding (py-1.5 = 5.25px at the 14px root) plus 2px top and bottom: 7.25px. Shared by Markets and Active facilities rows. */
export const MARKET_LIST_ROW_CLASS = `flex w-full items-center gap-2.5 py-[calc(0.375rem+2px)] pr-2 pl-3 text-left ${MODULE_ROW_HOVER_CLASS}`;

/** Drill-down cell typography: regular weight, foreground. */
export const MARKET_LIST_NAME_CLASS = "truncate leading-4 font-normal text-foreground";

/** Shared change badge tones; a fall in games is worse, a rise better. */
export const MARKET_CHANGE_PILL_CLASS: Record<StatDirection | "unknown", string> = {
	down: CHANGE_BADGE_TONE_CLASS.worse,
	up: CHANGE_BADGE_TONE_CLASS.better,
	flat: CHANGE_BADGE_TONE_CLASS.flat,
	unknown: CHANGE_BADGE_TONE_CLASS.flat,
};

export const MARKET_LIST_ROWS_CLASS = "flex flex-col";

/** The drill-down's faint row divider under every row. */
/** Shared module row divider (same color, thickness and extent as the Games/Users rows). */
export const MARKET_LIST_ROW_ITEM_CLASS = MODULE_ROW_DIVIDER_CLASS;

export const MARKET_LIST_CTA_CLASS = `flex w-full items-center justify-center gap-1 py-2 text-[12px] leading-[15px] font-semibold text-foreground ${MODULE_ROW_HOVER_CLASS}`;

/** Staging's header sort button: inline label + SortIcon (6px gap), hover group, pointer, focus outline. */
export const MARKET_LIST_SORT_BUTTON_CLASS =
	"group inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap font-bold focus-visible:outline-2 focus-visible:outline-primary";
