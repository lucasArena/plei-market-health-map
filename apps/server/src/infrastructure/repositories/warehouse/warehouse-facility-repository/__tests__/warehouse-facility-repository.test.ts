import {
	makeGetFacilityDetail,
	makeGetMarketGameInsights,
	makeGetMarketPlayerStats,
	makeGetMarketSummary,
	makeListFacilities,
	NotFoundError,
} from "@market-health-map/core/application";
import {
	FixedClock,
	InMemoryFacilityStatsRepository,
} from "@market-health-map/core/application/testing";
import { asEntityId } from "@market-health-map/core/domain";
import {
	ACTIVE_LOCATIONS_SQL,
	toFacility,
	WarehouseFacilityRepository,
} from "@server/infrastructure/repositories/warehouse/warehouse-facility-repository/warehouse-facility-repository";

const TODAY = "2026-10-08";
const TEST_CLOCK = new FixedClock(new Date("2026-10-08T16:00:00Z"));

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
		played_last_week: "0",
		company_id: null,
		company_logo: null,
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

	it("uses the company logo as the facility avatar", () => {
		expect(
			toFacility(row({ company_id: 123, company_logo: "Crossbar_+_Beer.png" }))?.toJSON().avatarUrl,
		).toBe("https://pleiapp.s3.amazonaws.com/uploads/company/logo/123/Crossbar_%2B_Beer.png");
		expect(toFacility(row({ company_id: 123, company_logo: "" }))?.toJSON().avatarUrl).toBeNull();
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

		const facilities = await new WarehouseFacilityRepository({ query }).listAll(TODAY);

		expect(query).toHaveBeenCalledWith(ACTIVE_LOCATIONS_SQL, [TODAY]);
		expect(ACTIVE_LOCATIONS_SQL).toContain("deleted_at is null");
		expect(ACTIVE_LOCATIONS_SQL).toContain(
			"g.date_with_time::date >= b.today - 28 and g.date_with_time::date < b.today as in_current",
		);
		expect(ACTIVE_LOCATIONS_SQL).toContain("g.date_with_time::date < b.today");
		expect(ACTIVE_LOCATIONS_SQL).toContain("select $1::date as today");
		expect(ACTIVE_LOCATIONS_SQL).not.toContain("current_date");
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

	it("joins the location's live company for its logo", () => {
		expect(ACTIVE_LOCATIONS_SQL).toContain("c.id as company_id, c.logo as company_logo");
		expect(ACTIVE_LOCATIONS_SQL).toContain(
			"left join plei_bronze.companies c on c.id = l.company_id and c.deleted_at is null",
		);
		expect(ACTIVE_LOCATIONS_SQL).not.toContain("logo_url");
	});

	it("merges a sponsor twin into its base facility at the same spot", async () => {
		const spot = { location_latitude: 39.96103151952558, location_longitude: -75.15279661864042 };
		const query = vi.fn().mockResolvedValue({
			rows: [
				row({
					location_id: 292,
					location_name: "Phield House",
					played_last_28_days: "16",
					played_last_week: "0",
					...spot,
				}),
				row({
					location_id: 698,
					location_name: "Phield House | Morby",
					played_last_28_days: "0",
					played_last_week: "0",
					...spot,
				}),
			],
		});

		const [facility, ...rest] = await new WarehouseFacilityRepository({ query }).listAll(TODAY);

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
			played_last_week: "0",
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
			played_last_week: "0",
		}),
		row({
			location_id: 5,
			location_name: "Ignite Sports Center",
			location_latitude: 38.7,
			location_longitude: -90.3,
			played_last_28_days: "3",
			played_last_week: "0",
		}),
	];
}

function ignoredRepository() {
	return new WarehouseFacilityRepository({
		query: vi.fn().mockResolvedValue({ rows: rowsWithIgnored() }),
	});
}

const COUNTS = {
	periodStart: "2026-09-03",
	periodEnd: "2026-09-30",
	weekStart: "2026-09-21",
	playedLastWeek: 0,
	playedPreviousWeek: 0,
	playedLast28Days: 0,
	playedPrevious28Days: 0,
	scheduledLast28Days: 0,
	scheduledPrevious28Days: 0,
	scheduledLastWeek: 0,
	scheduledPreviousWeek: 0,
	cancelledLastWeek: 0,
	cancelledPreviousWeek: 0,
	cancelledLast28Days: 0,
	cancelledPrevious28Days: 0,
	upcomingNextSevenDays: 0,
	lastPlayedDate: null,
	weeklyActivity: [],
	popularTimes: [],
	uniquePlayersLast28Days: 0,
	uniquePlayersPrevious28Days: 0,
	activatedPlayersLast28Days: 0,
	activatedPlayersPrevious28Days: 0,
	weeklyActivatedPlayers: [],
	uniquePlayersLastWeek: 0,
	uniquePlayersPreviousWeek: 0,
	activatedPlayersLastWeek: 0,
	activatedPlayersPreviousWeek: 0,
};

describe("ignored facilities downstream", () => {
	it("hides them from the repository before co-located twins are merged", async () => {
		const facilities = await ignoredRepository().listAll(TODAY);

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
		const list = await makeListFacilities({
			clock: TEST_CLOCK,
			facilities: ignoredRepository(),
		})();

		expect(list.map((facility) => facility.name)).toEqual(["Phield House", "Ignite Sports Center"]);
	});

	it("answers 404 for an ignored facility or twin in the detail panel", async () => {
		const stats = new InMemoryFacilityStatsRepository(COUNTS);
		const getFacilityDetail = makeGetFacilityDetail({
			clock: TEST_CLOCK,
			facilities: ignoredRepository(),
			stats,
		});

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

		const summary = await makeGetMarketSummary({
			clock: TEST_CLOCK,
			facilities: ignoredRepository(),
			stats,
		})();

		expect(summary.periods.month.scope).toEqual({
			facilityCount: 2,
			activeFacilityCount: 2,
			marketCount: 1,
			activeMarketCount: 1,
		});
		expect(summary.periods.month.topFacilities.map((facility) => facility.id)).toEqual(["1", "5"]);
		expect(summary.periods.month.topMarkets.map((market) => market.id)).toEqual(["7"]);
		expect(stats.reservationRequested).toEqual([["1", "5"]]);
	});

	it("answers 404 for a market whose only facilities are ignored", async () => {
		const getMarketSummary = makeGetMarketSummary({
			clock: TEST_CLOCK,
			facilities: ignoredRepository(),
			stats: new InMemoryFacilityStatsRepository(COUNTS),
		});

		await expect(getMarketSummary({ market: "8" })).rejects.toBeInstanceOf(NotFoundError);
	});

	it("leaves them out of market player stats and game insights", async () => {
		const stats = new InMemoryFacilityStatsRepository(COUNTS, [
			{
				facilityId: asEntityId("1"),
				playedLastWeek: 4,
				playedPreviousWeek: 1,
				playedLast28Days: 16,
				playedPrevious28Days: 4,
			},
			{
				facilityId: asEntityId("3"),
				playedLastWeek: 10,
				playedPreviousWeek: 0,
				playedLast28Days: 40,
				playedPrevious28Days: 1,
			},
		]);

		await makeGetMarketPlayerStats({ clock: TEST_CLOCK, facilities: ignoredRepository(), stats })();
		const insights = await makeGetMarketGameInsights({
			clock: TEST_CLOCK,
			facilities: ignoredRepository(),
			stats,
		})();

		expect(stats.playerRequested).toEqual([["1", "5"]]);
		expect(JSON.stringify(insights)).not.toContain("IGNORE");
	});
});

it("maps disjoint department totals and preserves the catalog classification order", () => {
	const result = toFacility(
		row({ magic_games: "6", organizer_games: "4", partnership_games: "2" }),
	);
	expect(result?.toJSON().metrics.gamesByDepartment).toEqual({
		magic: 6,
		organizers: 4,
		partnerships: 2,
	});
	expect(ACTIVE_LOCATIONS_SQL).toContain("select distinct partner_id from plei_gold.fct_terms");
	expect(ACTIVE_LOCATIONS_SQL).toContain("name ilike '%Organizer Program%' and deleted_at is null");
	expect(ACTIVE_LOCATIONS_SQL).toContain("when r.partner_id in (6, 52, 62) then 'magic'");
	expect(ACTIVE_LOCATIONS_SQL.indexOf("then 'magic'")).toBeLessThan(
		ACTIVE_LOCATIONS_SQL.indexOf("then 'organizers'"),
	);
	expect(ACTIVE_LOCATIONS_SQL).toContain("else 'partnerships'");
});

it("exposes department counts through the facility map DTO", async () => {
	const repository = new WarehouseFacilityRepository({
		query: vi.fn().mockResolvedValue({
			rows: [row({ magic_games: 6, organizer_games: 4, partnership_games: 2 })],
		}),
	});
	const points = await makeListFacilities({
		clock: TEST_CLOCK,
		facilities: repository,
	})();
	expect(points[0]?.gamesByDepartment).toEqual({ magic: 6, organizers: 4, partnerships: 2 });
	expect(points[0]?.gamesLast28Days).toBe(12);
});

describe("previous window games for the trend", () => {
	it("reads both windows in one query with one widened date filter", async () => {
		const query = vi.fn().mockResolvedValue({ rows: [row()] });

		await new WarehouseFacilityRepository({ query }).listAll(TODAY);

		expect(query).toHaveBeenCalledTimes(1);
		expect(ACTIVE_LOCATIONS_SQL).toContain("g.date_with_time::date >= b.today - 56");
		expect(ACTIVE_LOCATIONS_SQL.match(/from classified_games/g)).toHaveLength(1);
		expect(ACTIVE_LOCATIONS_SQL).toContain(
			"count(distinct r.reservation_id) filter (where r.in_current) as played_last_28_days",
		);
		expect(ACTIVE_LOCATIONS_SQL).toContain(
			"count(distinct r.reservation_id) filter (where not r.in_current) as played_previous_28_days",
		);
		expect(ACTIVE_LOCATIONS_SQL).toContain(
			"filter (where r.in_current and r.department = 'magic') as magic_games",
		);
		expect(ACTIVE_LOCATIONS_SQL).toContain(
			"filter (where not r.in_current and r.department = 'magic') as magic_games_previous",
		);
		expect(ACTIVE_LOCATIONS_SQL).toContain(
			"coalesce(a.played_previous_28_days, 0) as played_previous_28_days",
		);
	});

	it("keeps the previous window games on the facility, including zero games now", () => {
		const facility = toFacility(
			row({
				played_last_28_days: "0",
				played_previous_28_days: "9",
				magic_games: "0",
				organizer_games: "0",
				partnership_games: "0",
				magic_games_previous: "1",
				organizer_games_previous: "3",
				partnership_games_previous: "5",
			}),
		);

		expect(facility?.toJSON().metrics).toMatchObject({
			gamesLast28Days: 0,
			gamesPrevious28Days: 9,
			gamesPreviousByDepartment: { magic: 1, organizers: 3, partnerships: 5 },
		});
	});

	it("exposes previous window games through the facility map DTO", async () => {
		const listFacilities = makeListFacilities({
			clock: TEST_CLOCK,
			facilities: new WarehouseFacilityRepository({
				query: vi.fn().mockResolvedValue({
					rows: [
						row({
							played_last_28_days: 42,
							played_previous_28_days: 51,
							magic_games: 2,
							organizer_games: 10,
							partnership_games: 30,
							magic_games_previous: 1,
							organizer_games_previous: 20,
							partnership_games_previous: 30,
						}),
					],
				}),
			}),
		});

		const [point] = await listFacilities();

		expect(point).toMatchObject({
			gamesLast28Days: 42,
			gamesPrevious28Days: 51,
			gamesPreviousByDepartment: { magic: 1, organizers: 20, partnerships: 30 },
		});
	});
});

describe("weekly games for the 7D period", () => {
	it("counts the 7 full days ending yesterday and the 7 before in the same query", () => {
		expect(ACTIVE_LOCATIONS_SQL).toContain(
			"g.date_with_time::date >= b.today - 7 and g.date_with_time::date < b.today as in_last_week",
		);
		expect(ACTIVE_LOCATIONS_SQL).toContain(
			"g.date_with_time::date >= b.today - 14 and g.date_with_time::date < b.today - 7 as in_previous_week",
		);
		expect(ACTIVE_LOCATIONS_SQL).not.toContain("this_week");
		expect(ACTIVE_LOCATIONS_SQL).toContain(
			"filter (where r.in_last_week and r.department = 'magic') as magic_games_last_week",
		);
		expect(ACTIVE_LOCATIONS_SQL).toContain(
			"count(distinct r.reservation_id) filter (where r.in_previous_week) as played_previous_week",
		);
		expect(ACTIVE_LOCATIONS_SQL).toContain(
			"coalesce(a.partnership_games_previous_week, 0) as partnership_games_previous_week",
		);
	});

	it("keeps both weeks and their department splits on the facility", () => {
		const facility = toFacility(
			row({
				played_last_week: "6",
				magic_games_last_week: "1",
				organizer_games_last_week: "2",
				partnership_games_last_week: "3",
				played_previous_week: "9",
				magic_games_previous_week: "4",
				organizer_games_previous_week: "0",
				partnership_games_previous_week: "5",
			}),
		);

		expect(facility?.toJSON().metrics).toMatchObject({
			gamesLastWeek: 6,
			gamesLastWeekByDepartment: { magic: 1, organizers: 2, partnerships: 3 },
			gamesPreviousWeek: 9,
			gamesPreviousWeekByDepartment: { magic: 4, organizers: 0, partnerships: 5 },
		});
	});
});
