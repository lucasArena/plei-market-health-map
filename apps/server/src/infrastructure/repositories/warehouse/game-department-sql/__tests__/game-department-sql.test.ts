import {
	gameDepartmentCase,
	ORGANIZER_PARTNERS_CTE,
	organizerPartnersJoin,
} from "@server/infrastructure/repositories/warehouse/game-department-sql/game-department-sql";
import { ACTIVE_LOCATIONS_SQL } from "@server/infrastructure/repositories/warehouse/warehouse-facility-repository/warehouse-facility-repository";
import { FACILITY_RESERVATION_STATS_BY_DEPARTMENT_SQL } from "@server/infrastructure/repositories/warehouse/warehouse-facility-stats-repository/warehouse-facility-stats-repository";

describe("game department SQL", () => {
	it("classifies Magic partners first, then Organizer Program partners, then partnerships", () => {
		const department = gameDepartmentCase("r");

		expect(department.indexOf("then 'magic'")).toBeLessThan(
			department.indexOf("then 'organizers'"),
		);
		expect(department).toContain("r.partner_id in (6, 52, 62) then 'magic'");
		expect(department).toContain("else 'partnerships' end");
		expect(ORGANIZER_PARTNERS_CTE).toContain("name ilike '%Organizer Program%'");
		expect(organizerPartnersJoin("g")).toBe(
			"left join organizer_partners op on op.partner_id = g.partner_id",
		);
	});

	it("is the one rule both the map counts and the summary stats use", () => {
		for (const sql of [ACTIVE_LOCATIONS_SQL, FACILITY_RESERVATION_STATS_BY_DEPARTMENT_SQL]) {
			expect(sql).toContain(ORGANIZER_PARTNERS_CTE);
			expect(sql).toContain(gameDepartmentCase("r"));
			expect(sql).toContain(organizerPartnersJoin("r"));
		}
	});
});
