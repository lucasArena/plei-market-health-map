import {
	DRILL_DOWN_DATES_KEY,
	drillDownDatesSchema,
} from "@/infrastructure/cache/local-storage/drill-down-dates/drill-down-dates-preference";

describe("drill-down dates preference", () => {
	it("accepts a known range and comparison only", () => {
		expect(DRILL_DOWN_DATES_KEY).toBe("market-health-map:drill-down-dates");
		expect(drillDownDatesSchema.safeParse({ range: "90d", comparison: "year" }).success).toBe(true);
		expect(drillDownDatesSchema.safeParse({ range: "3y", comparison: "year" }).success).toBe(false);
	});
});
