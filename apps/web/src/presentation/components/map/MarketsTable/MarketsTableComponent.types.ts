import type {
	MarketGameChangeView,
	MarketHealthStatus,
	MarketSummaryMarketRankView,
} from "@market-health-map/core/application";
import type { Messages } from "@market-health-map/core/i18n";

export type MarketsTableMessages = Messages["marketsTable"];

export type MarketsTableSort = "status" | "games" | "change";

export type MarketChangeDirection = "up" | "down" | "flat";

export interface MarketsTableProps {
	markets: MarketSummaryMarketRankView[];
	changes: MarketGameChangeView[] | undefined;
}

export interface MarketChangeView {
	label: string;
	direction: MarketChangeDirection;
}

export interface MarketsTableRowView {
	id: string;
	name: string;
	status: MarketHealthStatus | null;
	statusLabel: string | null;
	activeLabel: string;
	games: number;
	gamesLabel: string;
	changePercent: number | null;
	change: MarketChangeView | null;
	openLabel: string;
}

export interface MarketsTableSortOption {
	key: MarketsTableSort;
	label: string;
}

export interface MarketStatusStyle {
	dot: string;
	halo: string;
	label: string;
}
