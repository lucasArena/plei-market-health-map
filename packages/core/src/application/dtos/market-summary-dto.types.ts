import type {
	FacilityPlayerStatsView,
	FacilityReservationStatsView,
} from "@core/application/dtos/facility-detail-dto.types";
import type { getMarketSummarySchema } from "@core/application/dtos/market-summary-dto";
import type { z } from "zod";

export type GetMarketSummaryInput = z.input<typeof getMarketSummarySchema>;

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
	gamesLast28Days: number;
}

export interface MarketSummaryMarketRankView {
	id: string;
	name: string;
	facilityCount: number;
	activeFacilityCount: number;
	gamesLast28Days: number;
}

export interface MarketSummaryView {
	scope: MarketSummaryScopeView;
	stats: FacilityReservationStatsView;
	gameChanges?: MarketGameChangeView[];
	topFacilities: MarketSummaryFacilityRankView[];
	topMarkets: MarketSummaryMarketRankView[];
}

export type MarketPlayerStatsView = FacilityPlayerStatsView;

export interface MarketGameChangeView {
	id: string;
	name: string;
	playedLast28Days: number;
	playedPrevious28Days: number;
	change: number;
	changePercent: number | null;
	facilities: FacilityGameChangeView[];
}
export interface FacilityGameChangeView {
	id: string;
	name: string;
	playedLast28Days: number;
	playedPrevious28Days: number;
	change: number;
	changePercent: number | null;
}
