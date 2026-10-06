import {
	type ActivityPeriodView,
	type FacilityDetailView,
	toPlayerPeriodView,
	toReservationPeriodView,
} from "@market-health-map/core/application";

export const FACILITY_DETAIL: FacilityDetailView = {
	facility: {
		id: "889",
		marketId: "houston",
		marketName: "Houston",
		name: "Pegaso HTX",
		avatarUrl: null,
		isActive: true,
		isActiveLastWeek: true,
		location: { latitude: 29.7, longitude: -95.4 },
		address: "1 Main St, Houston, TX",
	},
	stats: {
		periodStart: "2026-09-03",
		periodEnd: "2026-09-30",
		weekStart: "2026-09-21",
		playedLastWeek: 55,
		playedPreviousWeek: 51,
		playedLast28Days: 212,
		playedPrevious28Days: 200,
		scheduledLast28Days: 250,
		scheduledPrevious28Days: 240,
		uniquePlayersLast28Days: 126,
		uniquePlayersPrevious28Days: 120,
		activatedPlayersLast28Days: 24,
		activatedPlayersPrevious28Days: 20,
		uniquePlayersLastWeek: 30,
		uniquePlayersPreviousWeek: 25,
		activatedPlayersLastWeek: 6,
		activatedPlayersPreviousWeek: 5,
		scheduledLastWeek: 87,
		scheduledPreviousWeek: 87,
		cancelledLastWeek: 32,
		upcomingNextSevenDays: 41,
		lastPlayedDate: "2026-09-27",
		playedChangePercent: 7.8,
		playedPeriodChangePercent: 6,
		cancellationRate: 36.8,
		confirmationRate: 84.8,
		confirmationRateChangePoints: 1.5,
		uniquePlayersPeriodChangePercent: 5,
		activatedPlayersPeriodChangePercent: 20,
		weeklyActivity: [
			{ weekStart: "2026-08-31", gamesPlayed: 48 },
			{ weekStart: "2026-09-07", gamesPlayed: 58 },
			{ weekStart: "2026-09-14", gamesPlayed: 51 },
			{ weekStart: "2026-09-21", gamesPlayed: 55 },
		],
		popularTimes: [{ dayOfWeek: 6, timePeriod: 2, gamesPlayed: 12 }],
	},
};

export const FACILITY_MONTH_ACTIVITY: ActivityPeriodView = {
	...toReservationPeriodView(FACILITY_DETAIL.stats, "month"),
	...toPlayerPeriodView(FACILITY_DETAIL.stats, "month"),
};

export const FACILITY_WEEK_ACTIVITY: ActivityPeriodView = {
	...toReservationPeriodView(FACILITY_DETAIL.stats, "week"),
	...toPlayerPeriodView(FACILITY_DETAIL.stats, "week"),
};
