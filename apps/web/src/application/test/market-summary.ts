import type { MarketPlayerStatsView, MarketSummaryView } from "@market-health-map/core/application";
import { FACILITY_DETAIL } from "@/application/test/facility-detail";

const {
	uniquePlayersLast28Days,
	uniquePlayersPrevious28Days,
	activatedPlayersLast28Days,
	activatedPlayersPrevious28Days,
	uniquePlayersPeriodChangePercent,
	activatedPlayersPeriodChangePercent,
	...reservationStats
} = FACILITY_DETAIL.stats;

export const MARKET_SUMMARY: MarketSummaryView = {
	scope: { facilityCount: 142, activeFacilityCount: 84, marketCount: 12, activeMarketCount: 10 },
	stats: reservationStats,
	topFacilities: [
		{ id: "889", name: "Pegaso HTX", marketName: "Houston", gamesLast28Days: 41 },
		{ id: "292", name: "Phield House", marketName: "Philadelphia", gamesLast28Days: 1 },
	],
	topMarkets: [
		{
			id: "houston",
			name: "Houston",
			facilityCount: 9,
			activeFacilityCount: 6,
			gamesLast28Days: 120,
		},
	],
};

export const MARKET_PLAYER_STATS: MarketPlayerStatsView = {
	uniquePlayersLast28Days,
	uniquePlayersPrevious28Days,
	activatedPlayersLast28Days,
	activatedPlayersPrevious28Days,
	uniquePlayersPeriodChangePercent,
	activatedPlayersPeriodChangePercent,
};
