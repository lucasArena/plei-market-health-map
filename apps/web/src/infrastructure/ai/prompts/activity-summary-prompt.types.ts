import type {
	FacilityPlayerStatsView,
	FacilityReservationStatsView,
	MarketSummaryScopeView,
} from "@market-health-map/core/application";

export type ActivitySummaryKind = "facility" | "market" | "all-markets";

export type ActivitySummaryStats = FacilityReservationStatsView & FacilityPlayerStatsView;

export interface ActivitySummarySubject {
	kind: ActivitySummaryKind;
	id: string;
	name: string;
	stats: ActivitySummaryStats;
	scope?: MarketSummaryScopeView;
	insightFacts?: string;
}
