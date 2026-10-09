import {
	asEntityId,
	Facility,
	GAME_DEPARTMENTS,
	type GameDepartment,
} from "@market-health-map/core/domain";
import {
	metricDrillDownLocationsSql,
	organizerFactsFrom,
	playerFactsFrom,
	qualityFactsFrom,
	reservationFactsFrom,
	toDrillDownFacility,
	toDrillDownFacilityFact,
	WarehouseMetricDrillDownRepository,
} from "@server/infrastructure/repositories/warehouse/warehouse-metric-drill-down-repository/warehouse-metric-drill-down-repository";
import type {
	WarehouseDrillDownLocationRow,
	WarehouseDrillDownQualityRow,
	WarehouseQualityCount,
	WarehouseQueryable,
} from "@server/infrastructure/repositories/warehouse/warehouse-metric-drill-down-repository/warehouse-metric-drill-down-repository.types";
import {
	metricDrillDownFacilitiesSql,
	metricDrillDownOrganizerSql,
	metricDrillDownPlayerSql,
	metricDrillDownQualitySql,
	metricDrillDownReservationSql,
	QUALITY_COUNTS,
} from "@server/infrastructure/repositories/warehouse/warehouse-metric-drill-down-repository/warehouse-metric-drill-down-sql";

const baseRow: WarehouseDrillDownLocationRow = {
	location_id: 1,
	location_name: "Arena",
	address: "1 Main",
	city: "Miami",
	state: "FL",
	region_id: 10,
	region_name: "Miami",
	location_latitude: 25.7,
	location_longitude: -80.2,
	games: 12,
	magic_games: 2,
	organizer_games: 4,
	partnership_games: 6,
	company_id: null,
	company_logo: null,
};

describe("active organizers", () => {
	it("limits the query to organizer program partners with played games", () => {
		const sql = metricDrillDownOrganizerSql(28, false);
		expect(sql).toContain("select distinct r.location_id, r.partner_id");
		expect(sql).toContain("op.partner_id is not null");
		expect(sql).toContain("r.date_with_time::date >= b.today - 28");
		expect(sql).not.toContain("any($3::text[])");
		expect(metricDrillDownOrganizerSql(28, true)).toContain("any($3::text[])");
	});

	it("counts each organizer once per facility, market and in the total", async () => {
		const other: WarehouseDrillDownLocationRow = {
			...baseRow,
			location_id: 9,
			location_name: "Harbor",
			address: "9 Bay",
			location_latitude: 25.9,
			location_longitude: -80.1,
		};
		const query = vi
			.fn()
			.mockResolvedValueOnce({ rows: [baseRow, other] })
			.mockResolvedValueOnce({
				rows: [
					{ location_id: 1, partner_id: 7 },
					{ location_id: 1, partner_id: 8 },
					{ location_id: 9, partner_id: 7 },
				],
			});
		const view = await new WarehouseMetricDrillDownRepository({ query }).group({
			measure: "active-organizers",
			range: "28d",
			slice: "market",
			departments: ["organizers"],
			today: "2026-10-08",
			grain: "range",
		});
		expect(view.kind).toBe("distinct-count");
		expect(view.total).toBe(2);
		expect(view.rows.map((row) => row.value)).toEqual([2]);
		expect(query.mock.calls[1]?.[1]).toEqual([[1, 9], "2026-10-08", ["organizers"]]);
	});

	it("reads no organizers when no facility is in scope", async () => {
		const query = vi.fn().mockResolvedValueOnce({ rows: [] });
		const view = await new WarehouseMetricDrillDownRepository({ query }).group({
			measure: "active-organizers",
			range: "7d",
			slice: "facility",
			departments: [],
			today: "2026-10-08",
			grain: "range",
		});
		expect(view.total).toBe(0);
		expect(query).toHaveBeenCalledTimes(1);
	});

	it("builds organizer facts for merged facilities", () => {
		const facility = toDrillDownFacility(baseRow);
		if (!facility) throw new Error("Missing fixture");
		const [fact] = organizerFactsFrom([facility], [{ location_id: 1, partner_id: 7 }]);
		expect(fact?.activeOrganizerIds).toEqual(["7"]);
	});
});

describe("WarehouseMetricDrillDownRepository", () => {
	it("groups games in SQL over the requested window with department case", () => {
		const sql = metricDrillDownLocationsSql(90);
		expect(sql).toContain("g.date_with_time::date >= b.today - 90");
		expect(sql).toContain("g.date_with_time::date < b.today");
		expect(sql).toContain("when r.partner_id in (6, 52, 62) then 'magic'");
		expect(sql).toContain("count(distinct g.reservation_id)");
		expect(sql).not.toContain("current_date");
	});

	it("returns longer ranges for games and active facilities", async () => {
		const query = vi.fn().mockResolvedValue({ rows: [baseRow] });
		const repository = new WarehouseMetricDrillDownRepository({ query });
		const games = await repository.group({
			measure: "games",
			range: "90d",
			slice: "market",
			departments: [],
			today: "2026-10-08",
			grain: "range",
		});
		expect(query).toHaveBeenCalledWith(metricDrillDownLocationsSql(90), ["2026-10-08"]);
		expect(games).toMatchObject({
			total: 12,
			range: "90d",
			start: "2026-07-10",
			end: "2026-10-07",
			rows: [{ id: "10", name: "Miami", value: 12 }],
		});
		const active = await repository.group({
			measure: "active-facilities",
			range: "12m",
			slice: "facility",
			departments: ["magic"],
			today: "2026-10-08",
			grain: "range",
			marketId: "10",
		});
		expect(query).toHaveBeenCalledWith(metricDrillDownLocationsSql(365), ["2026-10-08"]);
		expect(active).toMatchObject({ total: 1, range: "12m" });
	});

	it("maps warehouse rows onto facilities and facts for merge", () => {
		const facility = toDrillDownFacility(baseRow);
		expect(facility?.toJSON().metrics.gamesLast28Days).toBe(12);
		expect(facility?.toJSON().metrics.gamesByDepartment).toEqual({
			magic: 2,
			organizers: 4,
			partnerships: 6,
		});
		expect(toDrillDownFacilityFact(facility as NonNullable<typeof facility>)).toEqual({
			id: "1",
			name: "Arena",
			marketId: "10",
			marketName: "Miami",
			games: 12,
			gamesByDepartment: { magic: 2, organizers: 4, partnerships: 6 },
		});
	});

	it("reuses reservation and player predicates on the grouped endpoint", () => {
		const scheduled = metricDrillDownReservationSql(7, false);
		expect(scheduled).toContain("r.reservation_type = 'OpenReservation'");
		expect(scheduled).toContain(
			"r.cancellation_reason in ('Recurring game series', 'Operational changes')",
		);
		expect(scheduled).toContain("g.confirmed and g.status <> 'cancelled'");
		expect(scheduled).toContain("r.date_with_time::date >= b.today - 7");
		expect(scheduled).toContain("location_id = any($1::int[])");
		expect(scheduled).not.toContain("1 - ");
		const filtered = metricDrillDownReservationSql(28, true);
		expect(filtered).toContain("= any($3::text[])");
		const players = metricDrillDownPlayerSql(28, false, false);
		expect(players).toContain("fct_games_opened");
		expect(players).toContain("dim_player");
		expect(players).toContain("f.valid_player + 0 = 1");
		expect(players).toContain("f.date_played >= b.today - 28");
		expect(players).not.toContain("player_lifecycle = 'Activated'");
		expect(metricDrillDownPlayerSql(7, true, true)).toContain("player_lifecycle = 'Activated'");
		expect(metricDrillDownPlayerSql(7, true, true)).toContain("= any($3::text[])");
		expect(metricDrillDownFacilitiesSql()).toContain("dim_location");
	});

	it("matches facility panel 7d confirmation and distinct player counts after merge", async () => {
		const query = vi
			.fn()
			.mockResolvedValueOnce({
				rows: [baseRow, { ...baseRow, location_id: 2, location_name: "Arena | B" }],
			})
			.mockResolvedValueOnce({
				rows: [
					{
						location_id: 1,
						scheduled: 40,
						played: 30,
						scheduled_magic: 10,
						scheduled_organizers: 15,
						scheduled_partnerships: 15,
						played_magic: 8,
						played_organizers: 12,
						played_partnerships: 10,
					},
					{
						location_id: 2,
						scheduled: 20,
						played: 15,
						scheduled_magic: 5,
						scheduled_organizers: 5,
						scheduled_partnerships: 10,
						played_magic: 4,
						played_organizers: 3,
						played_partnerships: 8,
					},
				],
			});
		const repository = new WarehouseMetricDrillDownRepository({ query });
		const rate = await repository.group({
			measure: "confirmation-rate",
			range: "7d",
			slice: "facility",
			departments: [],
			today: "2026-10-08",
			grain: "range",
		});
		expect(query.mock.calls[1]?.[0]).toContain("b.today - 7");
		expect(rate.total).toBe(75);
		expect(rate.rows[0]?.value).toBe(75);
		expect(rate.rows[0]?.denominator).toBe(60);
		expect(rate.rows[0]?.numerator).toBe(45);
	});

	it("counts a player once in the total when they play at two facilities", async () => {
		const other = {
			...baseRow,
			location_id: 9,
			location_name: "Bay",
			location_latitude: 26.7,
			location_longitude: -81.2,
		};
		const query = vi
			.fn()
			.mockResolvedValueOnce({ rows: [baseRow, other] })
			.mockResolvedValueOnce({
				rows: [
					{ location_id: 1, player_id: "p1", department: "magic" },
					{ location_id: 1, player_id: "p2", department: "organizers" },
					{ location_id: 9, player_id: "p1", department: "magic" },
					{ location_id: 9, player_id: "p3", department: "organizers" },
				],
			});
		const repository = new WarehouseMetricDrillDownRepository({ query });
		const unique = await repository.group({
			measure: "unique-players",
			range: "28d",
			slice: "facility",
			departments: [],
			today: "2026-10-08",
			grain: "range",
		});
		expect(unique.rows.map((row) => row.value)).toEqual([2, 2]);
		expect(unique.total).toBe(3);
		expect(unique.total).not.toBe(4);
	});

	it("groups scheduled games and activated players with a department filter", async () => {
		const query = vi
			.fn()
			.mockResolvedValueOnce({ rows: [baseRow] })
			.mockResolvedValueOnce({
				rows: [
					{
						location_id: 1,
						scheduled: 12,
						played: 10,
						scheduled_magic: 12,
						scheduled_organizers: 0,
						scheduled_partnerships: 0,
						played_magic: 10,
						played_organizers: 0,
						played_partnerships: 0,
					},
				],
			})
			.mockResolvedValueOnce({ rows: [baseRow] })
			.mockResolvedValueOnce({
				rows: [{ location_id: 1, player_id: "p2", department: "organizers" }],
			});
		const repository = new WarehouseMetricDrillDownRepository({ query });
		const scheduled = await repository.group({
			measure: "scheduled-games",
			range: "28d",
			slice: "market",
			departments: ["magic"],
			today: "2026-10-08",
			grain: "range",
		});
		expect(query.mock.calls[1]?.[0]).toContain("= any($3::text[])");
		expect(query.mock.calls[1]?.[1]).toEqual([[1], "2026-10-08", ["magic"]]);
		expect(scheduled).toMatchObject({ total: 12, kind: "count", measure: "scheduled-games" });
		const activated = await repository.group({
			measure: "activated-players",
			range: "90d",
			slice: "department",
			departments: ["organizers"],
			today: "2026-10-08",
			grain: "range",
		});
		expect(query.mock.calls[3]?.[0]).toContain("player_lifecycle = 'Activated'");
		expect(activated.total).toBe(1);
		expect(activated.rows).toEqual([expect.objectContaining({ id: "organizers", value: 1 })]);
	});

	it("scopes reservation measures to a facility and ignores unknown departments", async () => {
		const query = vi.fn().mockResolvedValue({ rows: [baseRow] });
		const repository = new WarehouseMetricDrillDownRepository({ query });
		query.mockResolvedValueOnce({ rows: [baseRow] }).mockResolvedValueOnce({
			rows: [
				{
					location_id: 1,
					scheduled: 8,
					played: 6,
					scheduled_magic: 8,
					scheduled_organizers: 0,
					scheduled_partnerships: 0,
					played_magic: 6,
					played_organizers: 0,
					played_partnerships: 0,
				},
			],
		});
		const scheduled = await repository.group({
			measure: "scheduled-games",
			range: "28d",
			slice: "facility",
			departments: [],
			today: "2026-10-08",
			grain: "range",
			facilityId: "1",
		});
		expect(scheduled.total).toBe(8);
		const emptyRate = await repository.group({
			measure: "confirmation-rate",
			range: "28d",
			slice: "facility",
			departments: [],
			today: "2026-10-08",
			grain: "range",
			facilityId: "missing",
		});
		expect(emptyRate.total).toBeNull();
		expect(emptyRate.rows).toEqual([]);
		expect(
			playerFactsFrom(
				[toDrillDownFacility(baseRow) as Facility],
				[{ location_id: 1, player_id: "p9", department: null }],
				"activated-players",
			)[0],
		).toMatchObject({ activatedPlayerIds: ["p9"] });
	});

	it("returns an empty view when the scope has no facilities", async () => {
		const query = vi.fn().mockResolvedValue({ rows: [baseRow] });
		const repository = new WarehouseMetricDrillDownRepository({ query });
		const empty = await repository.group({
			measure: "unique-players",
			range: "12m",
			slice: "facility",
			departments: [],
			today: "2026-10-08",
			grain: "range",
			marketId: "missing",
		});
		expect(empty.total).toBe(0);
		expect(empty.rows).toEqual([]);
		expect(query).toHaveBeenCalledTimes(1);
	});

	it("maps merged reservation and player rows onto facts", () => {
		const arena = toDrillDownFacility(baseRow) as Facility;
		const bay = Facility.create({
			id: asEntityId("9"),
			marketId: asEntityId("10"),
			marketName: "Miami",
			name: "Bay",
			address: "2 Main",
			location: { latitude: 26.7, longitude: -81.2 },
			avatarUrl: null,
			metrics: { activePlayers: 0, gamesLastWeek: 0, gamesLast28Days: 0, utilization: 0 },
		});
		expect(
			reservationFactsFrom(
				[arena],
				[
					{
						location_id: 1,
						scheduled: 60,
						played: 45,
						scheduled_magic: 20,
						scheduled_organizers: 20,
						scheduled_partnerships: 20,
						played_magic: 15,
						played_organizers: 15,
						played_partnerships: 15,
					},
				],
			)[0],
		).toMatchObject({ scheduled: 60, games: 45 });
		const players = playerFactsFrom(
			[arena, bay],
			[
				{ location_id: 1, player_id: "p1", department: "magic" },
				{ location_id: 9, player_id: "p1", department: "organizers" },
			],
			"unique-players",
		);
		expect(players[0]?.uniquePlayerIds).toEqual(["p1"]);
		expect(players[1]?.uniquePlayerIds).toEqual(["p1"]);
	});

	it("drops test, ignored, out-of-area and invalid facilities", () => {
		expect(toDrillDownFacility({ ...baseRow, location_name: "  " })).toBeNull();
		expect(toDrillDownFacility({ ...baseRow, location_name: "Plei Test Court" })).toBeNull();
		expect(toDrillDownFacility({ ...baseRow, location_name: "Court ignore me" })).toBeNull();
		expect(
			toDrillDownFacility({ ...baseRow, location_latitude: 80, location_longitude: -100 }),
		).toBeNull();
		expect(toDrillDownFacility({ ...baseRow, games: -1 })).toBeNull();
		const unassigned = toDrillDownFacility({
			...baseRow,
			region_id: null,
			region_name: null,
			address: null,
			city: null,
			state: null,
		});
		expect(unassigned?.marketId).toBe("unassigned");
		expect(unassigned?.toJSON().address).toBe("—");
	});
});

function qualityRow(
	locationId: number,
	counts: Partial<Record<WarehouseQualityCount, number>>,
	department: GameDepartment = "magic",
): WarehouseDrillDownQualityRow {
	const row: Record<string, number | string> = { location_id: locationId };
	for (const name of QUALITY_COUNTS) {
		row[name] = counts[name] ?? 0;
		for (const each of GAME_DEPARTMENTS)
			row[`${name}_${each}`] = each === department ? (counts[name] ?? 0) : 0;
	}
	return row as WarehouseDrillDownQualityRow;
}

describe("almost-filled and incident drill-down", () => {
	it("follows the catalog definitions in SQL", () => {
		const sql = metricDrillDownQualitySql(28, false);
		expect(sql).toContain("coalesce(g.cancellation_reason, 'Not enough players')");
		expect(sql).toContain("not in ('Recurring game series', 'Operational changes')");
		expect(sql).toContain("from plei_gold.fct_payouts p");
		expect(sql).toContain("count(*) as payout_rows");
		expect(sql).toContain("ro.payout_rows = 1 and ro.real_player_count is not null");
		expect(sql).toContain("g.min_player_count - ro.real_player_count between 1 and 3");
		expect(sql).not.toContain("coalesce(ro.real_player_count, 0)");
		expect(sql).not.toContain("p.deleted_at");
		expect(sql).toContain("select distinct v.reservation_id");
		expect(sql).toContain("v.rate < 3");
		expect(sql).toContain("left join low_rating_games lrg");
		expect(sql).toContain("count(distinct c.reservation_id) filter (where c.happened) as happened");
		expect(sql).toContain("as incident_games_partnerships");
		expect(sql).toContain("r.date_with_time::date >= b.today - 28");
		expect(sql).not.toContain("$3::text[]");
		expect(metricDrillDownQualitySql(7, true)).toContain("= any($3::text[])");
	});

	it("rates almost-filled games and reports missing rosters as data errors", async () => {
		const quality = [
			qualityRow(1, { almost_filled: 3, rostered_canceled: 10, missing_roster: 2 }),
			qualityRow(2, { almost_filled: 1, rostered_canceled: 6 }, "organizers"),
		];
		const locations = [baseRow, { ...baseRow, location_id: 2, location_name: "Arena | B" }];
		const query = vi.fn(async (sql: string) => ({
			rows: sql.includes("fct_payouts") ? quality : locations,
		})) as unknown as WarehouseQueryable["query"];
		const repository = new WarehouseMetricDrillDownRepository({ query });
		const view = await repository.group({
			measure: "almost-filled-rate",
			range: "28d",
			slice: "facility",
			departments: [],
			today: "2026-10-08",
			grain: "range",
		});
		expect(query).toHaveBeenCalledWith(metricDrillDownQualitySql(28, false), [
			[1, 2],
			"2026-10-08",
		]);
		expect(view).toMatchObject({
			kind: "rate",
			total: 25,
			numerator: 4,
			denominator: 16,
			dataErrors: 2,
			rows: [
				{
					id: "1",
					value: 25,
					numerator: 4,
					denominator: 16,
					dataErrors: 2,
					departments: { magic: 30, organizers: 16.7, partnerships: null },
				},
			],
		});
		const byDepartment = await repository.group({
			measure: "almost-filled-rate",
			range: "28d",
			slice: "department",
			departments: [],
			today: "2026-10-08",
			grain: "range",
		});
		expect(byDepartment.rows).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ id: "magic", numerator: 3, denominator: 10, dataErrors: 2 }),
				expect.objectContaining({ id: "organizers", dataErrors: 0 }),
			]),
		);
	});

	it("keeps unreviewed happened games in the incident rate", async () => {
		const query = vi
			.fn()
			.mockResolvedValueOnce({ rows: [baseRow] })
			.mockResolvedValueOnce({ rows: [qualityRow(1, { happened: 40, incident_games: 2 })] });
		const repository = new WarehouseMetricDrillDownRepository({ query });
		const rate = await repository.group({
			measure: "incident-games-rate",
			range: "7d",
			slice: "market",
			departments: ["magic"],
			today: "2026-10-08",
			grain: "range",
		});
		expect(query.mock.calls[1]?.[1]).toEqual([[1], "2026-10-08", ["magic"]]);
		expect(rate).toMatchObject({ total: 5, numerator: 2, denominator: 40 });
		expect(rate.dataErrors).toBeUndefined();
	});

	it("maps facilities without quality rows to zero counts", () => {
		const [fact] = qualityFactsFrom([toDrillDownFacility(baseRow) as Facility], []);
		expect(fact).toMatchObject({
			games: 0,
			almostFilled: 0,
			rosteredCanceled: 0,
			missingRoster: 0,
			incidentGames: 0,
		});
	});
});

it.each(["app-sessions", "registrations", "unique-users"] as const)(
	"groups %s separately from facility data",
	async (measure) => {
		const query = vi.fn().mockResolvedValue({
			rows: [
				{ region_id: 10, region_name: "Miami", is_total: 0, value: "2" },
				{ region_id: 20, region_name: "Houston", is_total: 0, value: "2" },
				{ region_id: null, region_name: null, is_total: 1, value: "3" },
			],
		});
		const view = await new WarehouseMetricDrillDownRepository({ query }).group({
			measure,
			range: "28d",
			slice: "market",
			departments: ["magic"],
			today: "2026-10-08",
			grain: "range",
			marketId: "10",
		});
		expect(view.total).toBe(3);
		expect(view.rows.map((row) => row.value)).toEqual([2, 2]);
		expect(view.rows.every((row) => row.departments === null)).toBe(true);
		expect(query).toHaveBeenCalledTimes(1);
		expect(query.mock.calls[0]?.[1]).toEqual(["2026-09-10", "2026-10-08", "10"]);
		const sql = query.mock.calls[0]?.[0];
		expect(sql).toContain("GROUP BY GROUPING SETS");
		expect(sql).toContain(
			measure === "app-sessions" ? "SUM(a.q_sessions)" : "COUNT(DISTINCT a.player_id)",
		);
		expect(sql).not.toContain("department");
	},
);
it("keeps unavailable app data unavailable and unassigned markets visible", async () => {
	const query = vi.fn().mockResolvedValue({
		rows: [{ region_id: null, region_name: null, is_total: 0, value: null }],
	});
	const view = await new WarehouseMetricDrillDownRepository({ query }).group({
		measure: "unique-users",
		range: "7d",
		slice: "market",
		departments: [],
		today: "2026-10-08",
		grain: "range",
	});
	expect(view.total).toBeNull();
	expect(view.rows).toEqual([
		{ id: "unassigned", name: "Unassigned", value: null, departments: null },
	]);
	expect(query.mock.calls[0]?.[1]).toEqual(["2026-10-01", "2026-10-08", null]);
});
