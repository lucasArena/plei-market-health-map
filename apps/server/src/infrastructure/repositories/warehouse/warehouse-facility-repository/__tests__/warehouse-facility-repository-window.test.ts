import { ACTIVE_LOCATIONS_SQL } from "@server/infrastructure/repositories/warehouse/warehouse-facility-repository/warehouse-facility-repository";

vi.mock("@market-health-map/core/domain", async (importOriginal) => ({
	...(await importOriginal<object>()),
	GAMES_WINDOW_DAYS: 7,
}));

describe("games query window", () => {
	it("compares seven completed days with the preceding seven days", () => {
		expect(ACTIVE_LOCATIONS_SQL).toContain(
			"g.date_with_time::date >= b.today - 7 and g.date_with_time::date < b.today as in_current",
		);
		expect(ACTIVE_LOCATIONS_SQL).toContain("g.date_with_time::date >= b.today - 14");
		expect(ACTIVE_LOCATIONS_SQL).not.toContain("b.today - 28");
		expect(ACTIVE_LOCATIONS_SQL).not.toContain("b.today - 56");
	});
});
