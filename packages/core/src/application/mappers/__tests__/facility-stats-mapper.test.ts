import {
	toPlayerPeriodView,
	toReservationPeriodView,
} from "@core/application/mappers/facility-stats-mapper";

const RESERVATIONS = {
	periodStart: "2026-09-07",
	periodEnd: "2026-10-04",
	weekStart: "2026-09-28",
	playedLastWeek: 45,
	playedPreviousWeek: 50,
	playedLast28Days: 212,
	playedPrevious28Days: 200,
	scheduledLast28Days: 250,
	scheduledPrevious28Days: 250,
	scheduledLastWeek: 60,
	scheduledPreviousWeek: 0,
	cancelledLastWeek: 15,
	cancelledPreviousWeek: 15,
	cancelledLast28Days: 60,
	cancelledPrevious28Days: 60,
	upcomingNextSevenDays: 41,
	lastPlayedDate: "2026-10-04",
	weeklyActivity: [],
	popularTimes: [],
};

const PLAYERS = {
	uniquePlayersLastWeek: 90,
	uniquePlayersPreviousWeek: 0,
	uniquePlayersLast28Days: 126,
	uniquePlayersPrevious28Days: 120,
	activatedPlayersLastWeek: 9,
	activatedPlayersPreviousWeek: 12,
	activatedPlayersLast28Days: 24,
	activatedPlayersPrevious28Days: 20,
};

describe("period views", () => {
	it("compares the last completed week with the week before", () => {
		expect(toReservationPeriodView(RESERVATIONS, "week")).toEqual({
			period: "week",
			start: "2026-09-28",
			end: "2026-10-04",
			played: 45,
			playedPrevious: 50,
			playedChangePercent: -10,
			confirmationRate: 75,
			confirmationRatePrevious: null,
			confirmationRateChangePoints: null,
			scheduled: 60,
			scheduledPrevious: 0,
			scheduledChangePercent: null,
			cancellationRate: 25,
			cancellationRatePrevious: null,
			cancellationRateChangePoints: null,
		});
		expect(toPlayerPeriodView(PLAYERS, "week")).toEqual({
			uniquePlayers: 90,
			uniquePlayersPrevious: 0,
			uniquePlayersChangePercent: null,
			activatedPlayers: 9,
			activatedPlayersPrevious: 12,
			activatedPlayersChangePercent: -25,
		});
	});

	it("compares the last 28 days with the 28 before", () => {
		expect(toReservationPeriodView(RESERVATIONS, "month")).toEqual({
			period: "month",
			start: "2026-09-07",
			end: "2026-10-04",
			played: 212,
			playedPrevious: 200,
			playedChangePercent: 6,
			confirmationRate: 84.8,
			confirmationRatePrevious: 80,
			confirmationRateChangePoints: 4.8,
			scheduled: 250,
			scheduledPrevious: 250,
			scheduledChangePercent: 0,
			cancellationRate: 24,
			cancellationRatePrevious: 24,
			cancellationRateChangePoints: 0,
		});
		expect(toPlayerPeriodView(PLAYERS, "month")).toMatchObject({
			uniquePlayers: 126,
			uniquePlayersChangePercent: 5,
			activatedPlayers: 24,
			activatedPlayersChangePercent: 20,
		});
	});
});
