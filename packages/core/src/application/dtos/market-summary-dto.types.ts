import type {
	FacilityPlayerStatsView,
	FacilityReservationStatsView,
} from "@core/application/dtos/facility-detail-dto.types";

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
	topFacilities: MarketSummaryFacilityRankView[];
	topMarkets: MarketSummaryMarketRankView[];
}

export type MarketPlayerStatsView = FacilityPlayerStatsView;
