import type {
	MarketAudienceView,
	MarketPlayerStatsView,
	MarketSummaryView,
} from "@market-health-map/core/application";
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
		},
		week: {
			scope: { facilityCount: 142, activeFacilityCount: 51, marketCount: 12, activeMarketCount: 8 },
			topFacilities: [{ id: "889", name: "Pegaso HTX", marketName: "Houston", games: 12 }],
			topMarkets: [
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

export const MARKET_AUDIENCE: MarketAudienceView = {
	periods: {
		week: {
			activeUsers: 4000,
			activeUsersPrevious: 4000,
			activeUsersChangePercent: 0,
			registrations: 120,
			registrationsPrevious: 0,
			registrationsChangePercent: null,
		},
		month: {
			activeUsers: 12000,
			activeUsersPrevious: 10000,
			activeUsersChangePercent: 20,
			registrations: 450,
			registrationsPrevious: 500,
			registrationsChangePercent: -10,
		},
	},
};
