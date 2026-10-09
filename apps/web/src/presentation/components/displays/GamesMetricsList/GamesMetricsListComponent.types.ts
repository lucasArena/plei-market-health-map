import type { Messages } from "@market-health-map/core/i18n";
import type { ModuleIconName } from "@/presentation/components/displays/ModuleIcon/ModuleIconComponent.types";

export const GamesMetricTone = { better: "better", worse: "worse", flat: "flat" } as const;

export type GamesMetricToneValue = (typeof GamesMetricTone)[keyof typeof GamesMetricTone];

export type GamesMetricKey =
	| "confirmation"
	| "cancellation"
	| "posted"
	| "registrations"
	| "activeUsers"
	| "uniqueUsers";

export type GamesMetricsMessages = Pick<
	Messages["marketSummary"],
	| "gamesLastPeriod"
	| "gamesVersusPreviousIn"
	| "gamesVersusPrevious"
	| "gamesPosted"
	| "cancellationRate"
	| "gamesChangePoints"
	| "gamesChangeBetter"
	| "gamesChangeWorse"
	| "gamesChangeSame"
	| "gamesNoPrevious"
	| "gamesVersusPreviousWeek"
	| "gamesNoPreviousWeek"
	| "gamesWeekOf"
	| "gamesChartTooltip"
	| "gamesUnitOne"
	| "gamesUnitOther"
>;

export interface GamesMetricChangeView {
	/** Raw direction of the value, which picks the arrow. */
	direction: "up" | "down" | "flat";
	/** Whether that direction is good or bad for this metric, which picks the color. */
	tone: GamesMetricToneValue;
	label: string;
	/** Screen-reader sentence, so the status is never color-only. */
	description: string;
}

export interface GamesMetricRowView {
	key: GamesMetricKey;
	label: string;
	value: string;
	/** "vs 83%". Null when there is no previous period to show. */
	previousLabel: string | null;
	/** Null when the change cannot be computed (no previous data). */
	change: GamesMetricChangeView | null;
	/** Still loading: the row keeps its label and shows placeholders instead of numbers. */
	isPending?: boolean;
	/** Screen-reader text while pending ("Loading New registrations…"). */
	pendingLabel?: string;
}

export interface GamesHeroView {
	value: string;
	/** "vs 178 in the previous 28 days". */
	comparison: string;
	change: GamesMetricChangeView | null;
}

/** One chart point: a week (the last four weeks in both 7D and 28D). */
export interface GamesSeriesPointView {
	key: string;
	/** Week start ("Sep 30"). */
	label: string;
	value: number;
	valueLabel: string;
	/** "games · Sep 30". */
	tooltipDetail: string;
	/** "Sep 9 – Sep 15". */
	rangeLabel: string;
	/** "45 games" (or "8 active players" in the Users module). */
	gamesLabel: string;
	/** Change vs the previous week in the series; null for the first week or after a 0 week. */
	change: GamesMetricChangeView | null;
	/** Full sentence for the focusable dot and the screen-reader list. */
	summary: string;
}

export interface GamesChartPoint {
	/** Week position across the (10px-inset) plot, 0–100 from the left. */
	xPercent: number;
	/** Value on the 0-based scale, 0–100 from the bottom. */
	yPercent: number;
	/**
	 * The same vertex measured from the top (100 − yPercent). The SVG line/area and
	 * the HTML dots both use xPercent/topPercent of the same plot box, so each dot
	 * centers exactly on its line vertex.
	 */
	topPercent: number;
}

export interface GamesChartView {
	points: GamesChartPoint[];
	/** SVG polyline points in a 0–100 viewBox. */
	linePoints: string;
	/** SVG polygon for the gradient area under the line, closed at the 0 baseline. */
	areaPoints: string;
}

export interface GamesChartTickView {
	value: number;
	label: string;
}

export interface GamesCardView {
	title: string;
	hero: GamesHeroView;
	series: GamesSeriesPointView[];
	axisMax: number;
	/** Drill-down style gridlines, 0 to axisMax. */
	ticks: GamesChartTickView[];
	rows: GamesMetricRowView[];
}

export interface GamesMetricsListProps {
	view: GamesCardView;
	messages: GamesMetricsMessages;
	/** Prefix for ids and test ids, so a second module (Users) can reuse this one. Defaults to "games". */
	idPrefix?: string;
	/** Title icon; defaults to the Games trophy. */
	icon?: ModuleIconName;
}
