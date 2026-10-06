import type {
	FacilityPlayerStatsView,
	FacilityReservationStatsView,
	StatsPeriod,
} from "@core/application/dtos/facility-detail-dto.types";
import type {
	getMarketGameInsightsSchema,
	getMarketSummarySchema,
} from "@core/application/dtos/market-summary-dto";
import type { z } from "zod";

export type GetMarketSummaryInput = z.input<typeof getMarketSummarySchema>;

export type GetMarketGameInsightsInput = z.input<typeof getMarketGameInsightsSchema>;

export interface MarketSummaryScopeView {
	facilityCount: number;
	activeFacilityCount: number;
	marketCount: number;
	activeMarketCount: number;
}

export interface MarketSummaryFacilityRankView {
	id: string;
	name: string;
	marketName: string;
	games: number;
}

export interface MarketSummaryMarketRankView {
	id: string;
	name: string;
	facilityCount: number;
	activeFacilityCount: number;
	games: number;
}

export interface MarketSummaryPeriodView {
	scope: MarketSummaryScopeView;
	topFacilities: MarketSummaryFacilityRankView[];
	topMarkets: MarketSummaryMarketRankView[];
}

export interface MarketSummaryView {
	stats: FacilityReservationStatsView;
	periods: Record<StatsPeriod, MarketSummaryPeriodView>;
	gameChanges?: MarketGameChangeView[];
}

export type MarketPlayerStatsView = FacilityPlayerStatsView;

export interface MarketGameChangeView {
	id: string;
	name: string;
	played: number;
	playedPrevious: number;
	change: number;
	changePercent: number | null;
	facilities: FacilityGameChangeView[];
}
export interface FacilityGameChangeView {
	id: string;
	name: string;
	played: number;
	playedPrevious: number;
	change: number;
	changePercent: number | null;
}
