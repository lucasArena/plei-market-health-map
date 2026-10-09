import {
	DRILL_DOWN_MEASURES,
	type MetricDrillDownQuery,
} from "@market-health-map/core/application";
import { WarehouseMetricDrillDownRepository } from "@server/infrastructure/repositories/warehouse/warehouse-metric-drill-down-repository/warehouse-metric-drill-down-repository";
import type { WarehouseTimeRow } from "@server/infrastructure/repositories/warehouse/warehouse-metric-drill-down-repository/warehouse-metric-drill-down-repository.types";
import {
	timeDrillDownView,
	timeDrillDownWindow,
} from "@server/infrastructure/repositories/warehouse/warehouse-metric-drill-down-repository/warehouse-metric-drill-down-time";
import { metricDrillDownTimeSql } from "@server/infrastructure/repositories/warehouse/warehouse-metric-drill-down-repository/warehouse-metric-drill-down-time-sql";

const query: MetricDrillDownQuery = {
	measure: "games",
	range: "28d",
	slice: "time",
	grain: "week",
	today: "2026-10-08",
	departments: [],
};
const result: WarehouseTimeRow = {
	bucket: "2026-09-07",
	department: null,
	is_total: 0,
	value: "5",
	numerator: "2",
	denominator: "8",
	data_errors: "1",
	facility_ids: ["a"],
};
describe("calendar drill-down", () => {
	it.each([
		["day", "2026-10-08", "2026-10-07"],
		["week", "2026-10-05", "2026-10-04"],
		["month", "2026-10-01", "2026-09-30"],
	] as const)("excludes current %s using the viewer's local today", (grain, until, end) => {
		expect(timeDrillDownWindow({ ...query, grain })).toEqual({ start: "2026-09-10", until, end });
	});
	it("handles Monday, month boundaries, leap days and year transitions", () => {
		expect(timeDrillDownWindow({ ...query, today: "2026-01-01", grain: "week" }).until).toBe(
			"2025-12-29",
		);
		expect(timeDrillDownWindow({ ...query, today: "2026-10-05" }).until).toBe("2026-10-05");
		const view = timeDrillDownView(
			{ ...query, today: "2024-03-01", grain: "day", range: "7d" },
			[],
		);
		expect(view.rows.at(-1)?.id).toBe("2024-02-29");
		expect(view.rows).toHaveLength(7);
		expect(
			timeDrillDownView(
				{ ...query, grain: "month", range: "12m", today: "2026-01-01" },
				[],
			).rows.at(-1)?.bucketEnd,
		).toBe("2025-12-31");
	});
	it("marks the first truncated bucket and fills empty buckets without fabricating rates", () => {
		const view = timeDrillDownView(query, [result, { ...result, bucket: null, is_total: 1 }]);
		expect(view.rows).toHaveLength(4);
		expect(view.rows[0]).toMatchObject({
			id: "2026-09-07",
			bucketStart: "2026-09-10",
			bucketEnd: "2026-09-13",
			partial: true,
			value: 5,
			facilityIds: ["a"],
		});
		expect(view.rows.at(-1)).toMatchObject({
			id: "2026-09-28",
			bucketEnd: "2026-10-04",
			value: 0,
			partial: false,
		});
		expect(view.rows.reduce((sum, row) => sum + (row.value ?? 0), 0)).toBe(view.total);
		expect(timeDrillDownView({ ...query, measure: "confirmation-rate" }, []).rows[0]).toMatchObject(
			{ value: null, numerator: 0, denominator: 0 },
		);
	});
	it("keeps rates and distinct totals independent and retains department values", () => {
		const rows = [
			result,
			{ ...result, bucket: "2026-09-14" },
			{ ...result, bucket: null, is_total: 1, value: "7" },
			{ ...result, department: "magic" as const, value: "2" },
		];
		const view = timeDrillDownView({ ...query, measure: "unique-players" }, rows);
		expect(view.total).toBe(7);
		expect(view.rows[0]?.departments?.magic).toBe(2);
		expect(view.rows.reduce((sum, row) => sum + (row.value ?? 0), 0)).toBe(10);
		const rate = timeDrillDownView({ ...query, measure: "almost-filled-rate" }, rows);
		expect(rate).toMatchObject({ total: 7, numerator: 2, denominator: 8, dataErrors: 1 });
		expect(rate.rows[0]).toMatchObject({ numerator: 2, denominator: 8, dataErrors: 1 });
		expect(
			timeDrillDownView({ ...query, measure: "unique-users", grain: "range" }, []).rows,
		).toHaveLength(28);
		expect(
			timeDrillDownView({ ...query, grain: "day", today: "2026-10-08", range: "12m" }, []).rows,
		).toHaveLength(365);
	});
	it.each(DRILL_DOWN_MEASURES)(
		"computes %s by bucket and independently for the total in SQL",
		(measure) => {
			const sql = metricDrillDownTimeSql({ ...query, measure });
			expect(sql).toContain("date_trunc('week', p.event_date)");
			expect(sql).toContain("group by grouping sets");
			expect(sql).toContain("$1::date");
			expect(sql).toContain("$2::date");
			expect(sql).not.toContain("current_date");
			if (["app-sessions", "registrations", "unique-users"].includes(measure)) {
				expect(sql).not.toContain("organizer_partners");
				expect(sql).toContain("p.region_id::text = $5");
			} else expect(sql).toContain("jsonb_each_text($4::jsonb)");
			if (measure === "app-sessions") expect(sql).toContain("sum(a.sessions)");
			if (measure === "unique-users") {
				expect(sql).toContain("s.q_sessions > 0");
				expect(sql).not.toContain("confirmed_at");
			}
			if (measure === "registrations") {
				expect(sql).toContain("p.confirmed_at::date");
				expect(sql).toContain("region_coordinates");
			}
			if (measure === "unique-players" || measure === "activated-players")
				expect(sql).toContain("f.date_played::date");
			if (measure === "activated-players") expect(sql).toContain("player_lifecycle = 'Activated'");
			if (measure.includes("rate")) expect(sql).toContain("/ nullif(");
			if (measure === "almost-filled-rate") {
				expect(sql).toContain("payout_rows = 1");
				expect(sql).toContain("real_player_count between 1 and 3");
				expect(sql).not.toContain("b.today - 1");
			}
			if (measure === "incident-games-rate")
				expect(sql).toContain("select distinct v.reservation_id");
			if (measure === "active-facilities")
				expect(sql).toContain("count(distinct a.facility_id) filter (where a.played)");
			if (measure === "active-organizers") {
				expect(sql).toContain("r.partner_id::text as entity_id");
				expect(sql).toContain("= 'organizers'");
			}
			expect(sql).not.toContain("a.bucket, a.organizer_id");
		},
	);
	it("returns no completed month without querying when the range is entirely current-month", async () => {
		const warehouse = { query: vi.fn() };
		const view = await new WarehouseMetricDrillDownRepository(warehouse).group({
			...query,
			range: "7d",
			grain: "month",
		});
		expect(view.rows).toEqual([]);
		expect(warehouse.query).not.toHaveBeenCalled();
	});
	it("binds app scopes and reads no facility data", async () => {
		const warehouse = { query: vi.fn().mockResolvedValue({ rows: [result] }) };
		const view = await new WarehouseMetricDrillDownRepository(warehouse).group({
			...query,
			measure: "unique-users",
			marketId: "10",
		});
		expect(warehouse.query).toHaveBeenCalledTimes(1);
		expect(warehouse.query.mock.calls[0]?.[1]).toEqual([
			"2026-09-10",
			"2026-10-05",
			[],
			"{}",
			"10",
		]);
		expect(view.rows[0]?.departments).toBeNull();
	});
	it("restricts time measures to scoped merged facilities and department", async () => {
		const location = {
			location_id: 1,
			location_name: "Arena",
			address: "1 Main",
			city: "Miami",
			state: "FL",
			region_id: 10,
			region_name: "Miami",
			location_latitude: 25.7,
			location_longitude: -80.2,
			games: 0,
			magic_games: 0,
			organizer_games: 0,
			partnership_games: 0,
			company_id: null,
			company_logo: null,
		};
		const warehouse = {
			query: vi
				.fn()
				.mockResolvedValueOnce({
					rows: [location, { ...location, location_id: 2, location_name: "Arena | B" }],
				})
				.mockResolvedValueOnce({ rows: [result] }),
		};
		await new WarehouseMetricDrillDownRepository(warehouse).group({
			...query,
			department: "magic",
			marketId: "10",
			facilityId: "1",
		});
		expect(warehouse.query.mock.calls[1]?.[1]).toEqual([
			"2026-09-10",
			"2026-10-05",
			["magic"],
			'{"1":"1","2":"1"}',
			"10",
		]);
		const empty = { query: vi.fn().mockResolvedValue({ rows: [] }) };
		await new WarehouseMetricDrillDownRepository(empty).group({
			...query,
			measure: "active-facilities",
		});
		expect(empty.query.mock.calls[1]?.[1]).toEqual(["2026-09-10", "2026-10-05", [], "{}", null]);
	});
	it("groups time buckets by organizer when segmented", () => {
		const sql = metricDrillDownTimeSql({ ...query, segment: "organizer" });
		expect(sql).toContain("(a.bucket, a.organizer_id)");
		expect(sql).toContain("plei_gold.dim_partner");
		expect(sql).toContain("grouping(a.organizer_id) = 0");
		const view = timeDrillDownView({ ...query, segment: "organizer" }, [
			result,
			{
				...result,
				organizer_id: "9",
				organizer_name: "Club",
				value: "2",
				facility_ids: ["a"],
			},
			{ ...result, bucket: null, is_total: 1, value: "5" },
		]);
		expect(view.rows[0]?.organizers).toEqual([
			expect.objectContaining({ id: "9", name: "Club", value: 2, facilityIds: ["a"] }),
		]);
	});
});
