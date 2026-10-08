import type { MarketPlayerStatsView, MarketSummaryView } from "@market-health-map/core/application";
import { FACILITY_DETAIL } from "@/application/test/facility-detail";

const {
	uniquePlayersLastWeek,
	uniquePlayersPreviousWeek,
	activatedPlayersLastWeek,
	activatedPlayersPreviousWeek,
	uniquePlayersLast28Days,
	uniquePlayersPrevious28Days,
	activatedPlayersLast28Days,
	activatedPlayersPrevious28Days,
	uniquePlayersPeriodChangePercent,
	activatedPlayersPeriodChangePercent,
	...reservationStats
} = FACILITY_DETAIL.stats;

export const MARKET_SUMMARY: MarketSummaryView = {
	stats: reservationStats,
	periods: {
		month: {
			scope: {
				facilityCount: 142,
				activeFacilityCount: 84,
				marketCount: 12,
				activeMarketCount: 10,
			},
			topFacilities: [
				{ id: "889", name: "Pegaso HTX", marketName: "Houston", games: 41 },
				{ id: "292", name: "Phield House", marketName: "Philadelphia", games: 1 },
			],
			topMarkets: [
				{ id: "houston", name: "Houston", facilityCount: 9, activeFacilityCount: 6, games: 120 },
			],
			markets: [
				{ id: "houston", name: "Houston", facilityCount: 9, activeFacilityCount: 6, games: 120 },
				{ id: "philly", name: "Philadelphia", facilityCount: 3, activeFacilityCount: 1, games: 1 },
			],
		},
		week: {
			scope: { facilityCount: 142, activeFacilityCount: 51, marketCount: 12, activeMarketCount: 8 },
			topFacilities: [{ id: "889", name: "Pegaso HTX", marketName: "Houston", games: 12 }],
			topMarkets: [
				{ id: "houston", name: "Houston", facilityCount: 9, activeFacilityCount: 4, games: 30 },
			],
			markets: [
				{ id: "houston", name: "Houston", facilityCount: 9, activeFacilityCount: 4, games: 30 },
			],
		},
	},
};

export const MARKET_PLAYER_STATS: MarketPlayerStatsView = {
	uniquePlayersLastWeek,
	uniquePlayersPreviousWeek,
	activatedPlayersLastWeek,
	activatedPlayersPreviousWeek,
	uniquePlayersLast28Days,
	uniquePlayersPrevious28Days,
	activatedPlayersLast28Days,
	activatedPlayersPrevious28Days,
	uniquePlayersPeriodChangePercent,
	activatedPlayersPeriodChangePercent,
};
