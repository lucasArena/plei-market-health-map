import type { Messages } from "@market-health-map/core/i18n";
import type { GamesHeroView } from "@/presentation/components/displays/GamesMetricsList/GamesMetricsListComponent.types";
import type { StatDirection } from "@/presentation/components/map/FacilityDetailPanel/FacilityDetailPanelComponent.types";

export const MarketTrendStatus = {
	declining: "declining",
	steady: "steady",
	new: "new",
	growing: "growing",
} as const;

export type MarketTrendStatus = (typeof MarketTrendStatus)[keyof typeof MarketTrendStatus];

/** The drill-down's two sortable columns: name and count. */
export const MarketListSort = { name: "name", games: "games", change: "change" } as const;

export type MarketListSort = (typeof MarketListSort)[keyof typeof MarketListSort];

export type MarketListSortOrder = "asc" | "desc";

export type MarketListKind = "markets" | "facilities";

export interface MarketListRowView {
	key: string;
	id: string;
	name: string;
	/** Games trend versus the previous period; null while the comparison is unavailable. */
	status: MarketTrendStatus | null;
	statusLabel: string | null;
	detail: string;
	games: number;
	gamesLabel: string;
	changePercent: number | null;
	/** null when no comparison is available yet (insights pending or failed). */
	changeDirection: StatDirection | null;
	changeLabel: string;
	ariaLabel: string;
}

export interface MarketListProps {
	rows: MarketListRowView[];
	emptyLabel: string;
	/** CTA label with the total, e.g. "See all 12 markets". */
	seeAllLabel: string;
	messages: Messages["marketSummary"];
	/** Active markets header (label, big number, pill, comparison), built like the Games hero. */
	hero: GamesHeroView;
	/** UI locale for the name tie-break (drill-down parity). */
	locale?: string;
	/**
	 * "markets" (default) or "facilities": same module (including the sortable
	 * "vs prev" column), with the facilities title, icon, column and ids.
	 */
	kind?: MarketListKind;
	onSelect(row: MarketListRowView): void;
}
