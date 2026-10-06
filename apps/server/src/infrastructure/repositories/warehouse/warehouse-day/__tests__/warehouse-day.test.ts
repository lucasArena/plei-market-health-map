import {
	WAREHOUSE_DAY_TIME_ZONE,
	WAREHOUSE_TODAY_SQL,
} from "@server/infrastructure/repositories/warehouse/warehouse-day/warehouse-day";

describe("warehouse day", () => {
	it("pins today to the westernmost zone in the service area, not the session zone", () => {
		expect(WAREHOUSE_DAY_TIME_ZONE).toBe("Pacific/Honolulu");
		expect(WAREHOUSE_TODAY_SQL).toBe("(now() at time zone 'Pacific/Honolulu')::date");
		expect(WAREHOUSE_TODAY_SQL).not.toContain("current_date");
	});
});
