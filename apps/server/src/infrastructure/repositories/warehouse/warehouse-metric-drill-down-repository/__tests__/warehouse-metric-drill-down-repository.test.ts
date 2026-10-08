import { asEntityId, Facility } from "@market-health-map/core/domain";
import {
	metricDrillDownLocationsSql,
	playerFactsFrom,
	reservationFactsFrom,
	toDrillDownFacility,
	toDrillDownFacilityFact,
	WarehouseMetricDrillDownRepository,
} from "@server/infrastructure/repositories/warehouse/warehouse-metric-drill-down-repository/warehouse-metric-drill-down-repository";
import type { WarehouseDrillDownLocationRow } from "@server/infrastructure/repositories/warehouse/warehouse-metric-drill-down-repository/warehouse-metric-drill-down-repository.types";
import {
	metricDrillDownFacilitiesSql,
	metricDrillDownPlayerSql,
	metricDrillDownReservationSql,
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
