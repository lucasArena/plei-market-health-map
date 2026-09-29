import { NotFoundError } from "@application/errors/use-case-error";
import { InMemoryFacilityRepository } from "@application/testing/in-memory-facility-repository";
import { InMemoryFacilityStatsRepository } from "@application/testing/in-memory-facility-stats-repository";
import { makeGetFacilityDetail } from "@application/use-cases/get-facility-detail";
import { asEntityId, Facility } from "@market-health-map/domain";

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
	weekStart: "2026-09-21",
	playedLastWeek: 55,
	playedPreviousWeek: 51,
	playedLast28Days: 212,
	scheduledLastWeek: 87,
	cancelledLastWeek: 32,
	upcomingNextSevenDays: 41,
	lastPlayedDate: "2026-09-28",
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

		expect(stats.requested).toEqual([["889"]]);
		expect(detail.facility).toEqual({
			id: "889",
			marketId: "2",
			name: "Pegaso HTX",
			avatarUrl: null,
			isActive: false,
			location: { latitude: 29.76, longitude: -95.37 },
			address: "1 Main St, Houston, Texas",
		});
		expect(detail.stats).toEqual({ ...COUNTS, playedChangePercent: 7.8, cancellationRate: 36.8 });
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
		expect(stats.requested).toEqual([["292", "698"]]);
	});

	it("leaves rates empty when there is nothing to compare against", async () => {
		const { getFacilityDetail } = setup({
			...COUNTS,
			playedPreviousWeek: 0,
			scheduledLastWeek: 0,
			cancelledLastWeek: 0,
		});

		const { stats } = await getFacilityDetail({ facilityId: "889" });

		expect(stats.playedChangePercent).toBeNull();
		expect(stats.cancellationRate).toBeNull();
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
