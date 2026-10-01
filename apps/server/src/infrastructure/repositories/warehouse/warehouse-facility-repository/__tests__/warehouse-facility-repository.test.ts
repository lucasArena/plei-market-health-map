import {
	makeGetFacilityDetail,
	makeGetMarketGameInsights,
	makeGetMarketPlayerStats,
	makeGetMarketSummary,
	makeListFacilities,
	NotFoundError,
} from "@market-health-map/core/application";
import { InMemoryFacilityStatsRepository } from "@market-health-map/core/application/testing";
import { asEntityId } from "@market-health-map/core/domain";
import {
	ACTIVE_LOCATIONS_SQL,
	toFacility,
	WarehouseFacilityRepository,
} from "@server/infrastructure/repositories/warehouse/warehouse-facility-repository/warehouse-facility-repository";

function row(overrides: object = {}) {
	return {
		location_id: 1042,
		location_name: "The Sports Yard | Section 109",
		address: "123 Main St",
		city: "St. Louis",
		state: "Missouri",
		region_id: 7,
		region_name: "St. Louis",
		location_latitude: 38.62,
		location_longitude: -90.19,
		played_last_28_days: "12",
		...overrides,
	};
}

describe("toFacility", () => {
	it("maps a warehouse row to a facility", () => {
		expect(toFacility(row())?.toJSON()).toEqual({
			id: "1042",
			marketId: "7",
			marketName: "St. Louis",
			name: "The Sports Yard | Section 109",
			address: "123 Main St, St. Louis, Missouri",
			location: { latitude: 38.62, longitude: -90.19 },
			avatarUrl: null,
			metrics: { activePlayers: 0, gamesLastWeek: 0, gamesLast28Days: 12, utilization: 0 },
			memberIds: ["1042"],
		});
	});

	it("falls back for missing region and address parts", () => {
		const facility = toFacility(row({ region_id: null, address: null, city: " ", state: null }));
		expect(facility?.toJSON()).toMatchObject({ marketId: "unassigned", address: "St. Louis" });
		expect(
			toFacility(row({ address: null, city: null, state: null, region_name: null }))?.toJSON()
				.address,
		).toBe("—");
	});

	it("skips unnamed, test and invalid locations", () => {
		expect(toFacility(row({ location_name: " " }))).toBeNull();
		expect(toFacility(row({ location_name: null }))).toBeNull();
		expect(toFacility(row({ location_name: "QA Test Soft Delete" }))).toBeNull();
		expect(toFacility(row({ region_name: "L2M Region" }))).toBeNull();
		expect(toFacility(row({ location_latitude: -84.23, location_longitude: 156.34 }))).toBeNull();
		expect(toFacility(row({ address: null, city: null, state: null, region_name: "" }))).toBeNull();
	});

	it("skips locations named with the word ignore in any case", () => {
		expect(toFacility(row({ location_name: "IGNORE - Test Gym" }))).toBeNull();
		expect(toFacility(row({ location_name: "Riverside Arena (ignore)" }))).toBeNull();
		expect(toFacility(row({ location_name: "Phield House | IGNORE" }))).toBeNull();
		expect(toFacility(row({ location_name: "Signore Fitness" }))).not.toBeNull();
		expect(toFacility(row({ location_name: "Ignored" }))).not.toBeNull();
		expect(toFacility(row({ location_name: "Ignite Sports Center" }))).not.toBeNull();
	});
});

describe("WarehouseFacilityRepository", () => {
	it("queries active located facilities and keeps the valid ones", async () => {
		const query = vi.fn().mockResolvedValue({
			rows: [row(), row({ location_id: 2, location_name: "adidas TEST" })],
		});

		const facilities = await new WarehouseFacilityRepository({ query }).listAll();

		expect(query).toHaveBeenCalledWith(ACTIVE_LOCATIONS_SQL);
		expect(ACTIVE_LOCATIONS_SQL).toContain("deleted_at is null");
		expect(ACTIVE_LOCATIONS_SQL).toContain("r.date_with_time::date >= b.this_week - 28");
		expect(ACTIVE_LOCATIONS_SQL).toContain("r.date_with_time::date < b.this_week");
		expect(facilities.map((facility) => facility.id)).toEqual(["1042"]);
	});

	it("only lists locations where at least one game was ever posted", () => {
		expect(ACTIVE_LOCATIONS_SQL).toContain("and exists (");
		expect(ACTIVE_LOCATIONS_SQL).toContain("from plei_gold.dim_reservation posted");
		expect(ACTIVE_LOCATIONS_SQL).toContain("where posted.location_id = l.location_id");
		const existsClause = ACTIVE_LOCATIONS_SQL.slice(ACTIVE_LOCATIONS_SQL.indexOf("and exists ("));
		expect(existsClause).not.toContain("status");
		expect(existsClause).not.toContain("reservation_type");
	});

	it("merges a sponsor twin into its base facility at the same spot", async () => {
		const spot = { location_latitude: 39.96103151952558, location_longitude: -75.15279661864042 };
		const query = vi.fn().mockResolvedValue({
			rows: [
				row({
					location_id: 292,
					location_name: "Phield House",
					played_last_28_days: "16",
					...spot,
				}),
				row({
					location_id: 698,
					location_name: "Phield House | Morby",
					played_last_28_days: "0",
					...spot,
				}),
			],
		});

		const [facility, ...rest] = await new WarehouseFacilityRepository({ query }).listAll();

		expect(rest).toEqual([]);
		expect(facility?.toJSON()).toMatchObject({
			id: "292",
			name: "Phield House",
			memberIds: ["292", "698"],
			metrics: { gamesLast28Days: 16 },
		});
	});
});

const SPOT = { location_latitude: 39.96103151952558, location_longitude: -75.15279661864042 };

function rowsWithIgnored() {
	return [
		row({ location_id: 1, location_name: "Phield House", played_last_28_days: "16", ...SPOT }),
		row({
			location_id: 2,
			location_name: "Phield House | IGNORE",
			played_last_28_days: "9",
			...SPOT,
		}),
		row({ location_id: 3, location_name: "IGNORE - Test Gym", played_last_28_days: "40" }),
		row({
			location_id: 4,
			location_name: "Riverside Arena (ignore)",
			region_id: 8,
			region_name: "Houston",
			location_latitude: 29.76,
			location_longitude: -95.37,
			played_last_28_days: "5",
		}),
		row({
			location_id: 5,
			location_name: "Ignite Sports Center",
			location_latitude: 38.7,
			location_longitude: -90.3,
			played_last_28_days: "3",
		}),
	];
}

function ignoredRepository() {
	return new WarehouseFacilityRepository({
		query: vi.fn().mockResolvedValue({ rows: rowsWithIgnored() }),
	});
}

const COUNTS = {
	weekStart: "2026-09-21",
	playedLastWeek: 0,
	playedPreviousWeek: 0,
	playedLast28Days: 0,
	playedPrevious28Days: 0,
	scheduledLast28Days: 0,
	scheduledPrevious28Days: 0,
	scheduledLastWeek: 0,
	cancelledLastWeek: 0,
	upcomingNextSevenDays: 0,
	lastPlayedDate: null,
	weeklyActivity: [],
	popularTimes: [],
	uniquePlayersLast28Days: 0,
	uniquePlayersPrevious28Days: 0,
	activatedPlayersLast28Days: 0,
	activatedPlayersPrevious28Days: 0,
};

describe("ignored facilities downstream", () => {
	it("hides them from the repository before co-located twins are merged", async () => {
		const facilities = await ignoredRepository().listAll();

		expect(facilities.map((facility) => facility.toJSON())).toEqual([
			expect.objectContaining({
				id: "1",
				memberIds: ["1"],
				metrics: expect.objectContaining({ gamesLast28Days: 16 }),
			}),
			expect.objectContaining({ id: "5", name: "Ignite Sports Center" }),
		]);
	});

	it("leaves them out of the map list and search source", async () => {
		const list = await makeListFacilities({ facilities: ignoredRepository() })();

		expect(list.map((facility) => facility.name)).toEqual(["Phield House", "Ignite Sports Center"]);
	});

	it("answers 404 for an ignored facility or twin in the detail panel", async () => {
		const stats = new InMemoryFacilityStatsRepository(COUNTS);
		const getFacilityDetail = makeGetFacilityDetail({ facilities: ignoredRepository(), stats });

		await expect(getFacilityDetail({ facilityId: "3" })).rejects.toBeInstanceOf(NotFoundError);
		await expect(getFacilityDetail({ facilityId: "2" })).rejects.toBeInstanceOf(NotFoundError);
		await expect(getFacilityDetail({ facilityId: "1" })).resolves.toMatchObject({
			facility: { id: "1", name: "Phield House" },
		});
		expect(stats.reservationRequested).toEqual([["1"]]);
		expect(stats.playerRequested).toEqual([["1"]]);
	});

	it("leaves them out of the market summary counts, rankings and stats query", async () => {
		const stats = new InMemoryFacilityStatsRepository(COUNTS);

		const summary = await makeGetMarketSummary({ facilities: ignoredRepository(), stats })();

		expect(summary.scope).toEqual({
			facilityCount: 2,
			activeFacilityCount: 2,
			marketCount: 1,
			activeMarketCount: 1,
		});
		expect(summary.topFacilities.map((facility) => facility.id)).toEqual(["1", "5"]);
		expect(summary.topMarkets.map((market) => market.id)).toEqual(["7"]);
		expect(stats.reservationRequested).toEqual([["1", "5"]]);
	});

	it("answers 404 for a market whose only facilities are ignored", async () => {
		const getMarketSummary = makeGetMarketSummary({
			facilities: ignoredRepository(),
			stats: new InMemoryFacilityStatsRepository(COUNTS),
		});

		await expect(getMarketSummary({ market: "8" })).rejects.toBeInstanceOf(NotFoundError);
	});

	it("leaves them out of market player stats and game insights", async () => {
		const stats = new InMemoryFacilityStatsRepository(COUNTS, [
			{ facilityId: asEntityId("1"), playedLast28Days: 16, playedPrevious28Days: 4 },
			{ facilityId: asEntityId("3"), playedLast28Days: 40, playedPrevious28Days: 1 },
		]);

		await makeGetMarketPlayerStats({ facilities: ignoredRepository(), stats })();
		const insights = await makeGetMarketGameInsights({ facilities: ignoredRepository(), stats })();

		expect(stats.playerRequested).toEqual([["1", "5"]]);
		expect(JSON.stringify(insights)).not.toContain("IGNORE");
	});
});
