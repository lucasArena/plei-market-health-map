import { NotFoundError } from "@core/application/errors/not-found-error";
import { makeGetFacilityPlayerStats } from "@core/application/services/get-facility-player-stats";
import { makeGetFacilityReservationStats } from "@core/application/services/get-facility-reservation-stats";
import { InMemoryFacilityRepository } from "@core/application/testing/in-memory-facility-repository";
import { InMemoryFacilityStatsRepository } from "@core/application/testing/in-memory-facility-stats-repository";
import { asEntityId, Facility } from "@core/domain";

const FACILITY = Facility.create({
	id: asEntityId("292"),
	marketId: asEntityId("22"),
	name: "Phield House",
	address: "814 Spring Garden St, Philadelphia, PA",
	location: { latitude: 39.96, longitude: -75.15 },
	avatarUrl: null,
	memberIds: [asEntityId("698")],
	metrics: { activePlayers: 0, gamesLastWeek: 0, gamesLast28Days: 16, utilization: 0 },
});

const COUNTS = {
	weekStart: "2026-09-21",
	playedLastWeek: 55,
	playedPreviousWeek: 50,
	playedLast28Days: 212,
	playedPrevious28Days: 200,
	scheduledLast28Days: 250,
	scheduledPrevious28Days: 240,
	uniquePlayersLast28Days: 126,
	uniquePlayersPrevious28Days: 120,
	activatedPlayersLast28Days: 24,
	activatedPlayersPrevious28Days: 20,
	scheduledLastWeek: 80,
	cancelledLastWeek: 20,
	upcomingNextSevenDays: 41,
	lastPlayedDate: "2026-09-28",
	weeklyActivity: [],
	popularTimes: [],
};

function setup() {
	const facilities = new InMemoryFacilityRepository([FACILITY]);
	const stats = new InMemoryFacilityStatsRepository(COUNTS);
	return {
		stats,
		getReservationStats: makeGetFacilityReservationStats({ facilities, stats }),
		getPlayerStats: makeGetFacilityPlayerStats({ facilities, stats }),
	};
}

describe("progressive facility stats", () => {
	it("returns reservation analytics independently for every merged facility member", async () => {
		const { getReservationStats, stats } = setup();

		await expect(getReservationStats({ facilityId: "698" })).resolves.toMatchObject({
			facility: {
				id: "292",
				address: "814 Spring Garden St, Philadelphia, PA",
			},
			stats: {
				playedLastWeek: 55,
				playedChangePercent: 10,
				cancellationRate: 25,
			},
		});
		expect(stats.reservationRequested).toEqual([["292", "698"]]);
		expect(stats.playerRequested).toEqual([]);
	});

	it("returns player analytics independently", async () => {
		const { getPlayerStats, stats } = setup();

		await expect(getPlayerStats({ facilityId: "292" })).resolves.toEqual({
			uniquePlayersLast28Days: 126,
			uniquePlayersPrevious28Days: 120,
			activatedPlayersLast28Days: 24,
			activatedPlayersPrevious28Days: 20,
			uniquePlayersPeriodChangePercent: 5,
			activatedPlayersPeriodChangePercent: 20,
		});
		expect(stats.playerRequested).toEqual([["292", "698"]]);
		expect(stats.reservationRequested).toEqual([]);
	});

	it("rejects unknown facilities at either boundary", async () => {
		const { getReservationStats, getPlayerStats } = setup();

		await expect(getReservationStats({ facilityId: "missing" })).rejects.toBeInstanceOf(
			NotFoundError,
		);
		await expect(getPlayerStats({ facilityId: "missing" })).rejects.toBeInstanceOf(NotFoundError);
	});
});
