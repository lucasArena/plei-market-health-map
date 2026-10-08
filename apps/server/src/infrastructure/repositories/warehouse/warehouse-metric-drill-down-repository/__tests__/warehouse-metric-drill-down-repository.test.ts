import {
	metricDrillDownLocationsSql,
	toDrillDownFacility,
	toDrillDownFacilityFact,
	WarehouseMetricDrillDownRepository,
} from "@server/infrastructure/repositories/warehouse/warehouse-metric-drill-down-repository/warehouse-metric-drill-down-repository";
import type { WarehouseDrillDownLocationRow } from "@server/infrastructure/repositories/warehouse/warehouse-metric-drill-down-repository/warehouse-metric-drill-down-repository.types";

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
