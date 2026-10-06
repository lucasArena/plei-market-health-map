import { NotFoundError } from "@core/application/errors/not-found-error";
import { makeGetFacilityDetail } from "@core/application/services/get-facility-detail";
import { InMemoryFacilityRepository } from "@core/application/testing/in-memory-facility-repository";
import { InMemoryFacilityStatsRepository } from "@core/application/testing/in-memory-facility-stats-repository";
import { asEntityId, Facility } from "@core/domain";

const FACILITY = Facility.create({
	id: asEntityId("889"),
	marketId: asEntityId("2"),
	name: "Pegaso HTX",
	address: "1 Main St, Houston, Texas",
	location: { latitude: 29.76, longitude: -95.37 },
	avatarUrl: null,
	metrics: { activePlayers: 0, gamesLastWeek: 0, gamesLast28Days: 0, utilization: 0 },
});

const COUNTS = {
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
	lastPlayedDate: "2026-09-28",
	weeklyActivity: [
		{ weekStart: "2026-08-31", gamesPlayed: 48 },
		{ weekStart: "2026-09-07", gamesPlayed: 58 },
		{ weekStart: "2026-09-14", gamesPlayed: 51 },
		{ weekStart: "2026-09-21", gamesPlayed: 55 },
	],
	popularTimes: [{ dayOfWeek: 6, timePeriod: 2, gamesPlayed: 12 }],
};

function setup(counts = COUNTS) {
	const stats = new InMemoryFacilityStatsRepository(counts);
	const getFacilityDetail = makeGetFacilityDetail({
		facilities: new InMemoryFacilityRepository([FACILITY]),
		stats,
	});
	return { getFacilityDetail, stats };
}

describe("getFacilityDetail", () => {
	it("returns the facility with its weekly stats and derived rates", async () => {
		const { getFacilityDetail, stats } = setup();

		const detail = await getFacilityDetail({ facilityId: " 889 " });

		expect(stats.reservationRequested).toEqual([["889"]]);
		expect(stats.playerRequested).toEqual([["889"]]);
		expect(detail.facility).toEqual({
			id: "889",
			marketId: "2",
			marketName: "2",
			name: "Pegaso HTX",
			avatarUrl: null,
			isActive: false,
			gamesLast28Days: 0,
			gamesLastWeek: 0,
			isActiveLastWeek: false,
			location: { latitude: 29.76, longitude: -95.37 },
			address: "1 Main St, Houston, Texas",
		});
		expect(detail.stats).toEqual({
			...COUNTS,
			playedChangePercent: 7.8,
			playedPeriodChangePercent: 6,
			cancellationRate: 36.8,
			confirmationRate: 84.8,
			confirmationRateChangePoints: 1.5,
			uniquePlayersPeriodChangePercent: 5,
			activatedPlayersPeriodChangePercent: 20,
		});
	});

	it("resolves any member id of a merged facility and requests stats for the whole group", async () => {
		const merged = Facility.create({
			id: asEntityId("292"),
			marketId: asEntityId("22"),
			name: "Phield House",
			address: "814 Spring Garden St, Philadelphia, PA",
			location: { latitude: 39.96, longitude: -75.15 },
			avatarUrl: null,
			memberIds: [asEntityId("698")],
			metrics: { activePlayers: 0, gamesLastWeek: 0, gamesLast28Days: 16, utilization: 0 },
		});
		const stats = new InMemoryFacilityStatsRepository(COUNTS);
		const getFacilityDetail = makeGetFacilityDetail({
			facilities: new InMemoryFacilityRepository([merged]),
			stats,
		});

		const detail = await getFacilityDetail({ facilityId: "698" });

		expect(detail.facility).toMatchObject({ id: "292", name: "Phield House", isActive: true });
		expect(stats.reservationRequested).toEqual([["292", "698"]]);
		expect(stats.playerRequested).toEqual([["292", "698"]]);
	});

	it("leaves rates empty when there is nothing to compare against", async () => {
		const { getFacilityDetail } = setup({
			...COUNTS,
			playedPreviousWeek: 0,
			playedPrevious28Days: 0,
			scheduledLastWeek: 0,
			scheduledPreviousWeek: 0,
			cancelledLastWeek: 0,
			scheduledLast28Days: 0,
			scheduledPrevious28Days: 0,
			uniquePlayersPrevious28Days: 0,
			activatedPlayersPrevious28Days: 0,
			uniquePlayersLastWeek: 0,
			uniquePlayersPreviousWeek: 0,
			activatedPlayersLastWeek: 0,
			activatedPlayersPreviousWeek: 0,
		});

		const { stats } = await getFacilityDetail({ facilityId: "889" });

		expect(stats.playedChangePercent).toBeNull();
		expect(stats.playedPeriodChangePercent).toBeNull();
		expect(stats.cancellationRate).toBeNull();
		expect(stats.confirmationRate).toBeNull();
		expect(stats.confirmationRateChangePoints).toBeNull();
		expect(stats.uniquePlayersPeriodChangePercent).toBeNull();
		expect(stats.activatedPlayersPeriodChangePercent).toBeNull();
	});

	it("throws when the facility does not exist", async () => {
		await expect(setup().getFacilityDetail({ facilityId: "missing" })).rejects.toBeInstanceOf(
			NotFoundError,
		);
	});

	it("rejects a blank facility id", async () => {
		await expect(setup().getFacilityDetail({ facilityId: " " })).rejects.toThrow();
	});
});
