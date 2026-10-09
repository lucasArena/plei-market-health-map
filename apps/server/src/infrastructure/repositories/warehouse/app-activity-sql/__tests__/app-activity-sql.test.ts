import {
	appActivitySql,
	REGISTRATION_PERIOD_PREDICATE,
	REGISTRATION_REGIONS_CTE,
} from "@server/infrastructure/repositories/warehouse/app-activity-sql/app-activity-sql";
import { REGISTRATION_HEATMAP_SQL } from "@server/infrastructure/repositories/warehouse/warehouse-app-session-heatmap-repository/warehouse-app-session-heatmap-repository";

it("shares registration scope and range with the heatmap", () => {
	const sql = appActivitySql(true, false);
	for (const query of [sql, REGISTRATION_HEATMAP_SQL]) {
		expect(query).toContain(REGISTRATION_PERIOD_PREDICATE);
		expect(query).toContain(REGISTRATION_REGIONS_CTE);
		expect(query).toContain("JOIN region_coordinates c ON c.region_id = p.region_id");
	}
});
it("counts users once per market and in an independently grouped total without account eligibility filters", () => {
	const sql = appActivitySql(false, false);
	expect(sql).toContain("COUNT(DISTINCT a.player_id)");
	expect(sql).toContain("GROUP BY GROUPING SETS ((a.region_id, r.region_name), ())");
	expect(sql).toContain("s.q_sessions > 0");
	expect(sql).toContain("LEFT JOIN plei_gold.dim_player p ON p.player_id = s.player_id");
	expect(sql).not.toContain("p.players_type");
	expect(sql).not.toContain("s.lat");
	expect(sql).not.toContain("s.lng");
});

it("sums all recorded session counts rather than counting daily rows", () => {
	const sql = appActivitySql(false, true);
	expect(sql).toContain("SUM(a.q_sessions)");
	expect(sql).not.toContain("s.q_sessions > 0");
	expect(sql).not.toContain("location_latitude");
});
