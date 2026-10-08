import { SampleFacilityRepository } from "@server/infrastructure/repositories/sample/sample-facility-repository/sample-facility-repository";
import { SampleMetricDrillDownRepository } from "@server/infrastructure/repositories/sample/sample-metric-drill-down-repository/sample-metric-drill-down-repository";

describe("SampleMetricDrillDownRepository", () => {
	it("returns games and active facilities for short and longer ranges", async () => {
		const repository = new SampleMetricDrillDownRepository(new SampleFacilityRepository());
		const games = await repository.group({
			measure: "games",
			range: "28d",
			slice: "market",
			departments: [],
			today: "2026-10-08",
			grain: "range",
		});
		expect(games.range).toBe("28d");
		expect(games.kind).toBe("count");
		expect(games.rows.length).toBeGreaterThan(0);
		const longer = await repository.group({
			measure: "active-facilities",
			range: "90d",
			slice: "facility",
			departments: [],
			today: "2026-10-08",
			grain: "range",
		});
		expect(longer.range).toBe("90d");
		expect(longer.start).toBe("2026-07-10");
		expect(longer.end).toBe("2026-10-07");
		const week = await repository.group({
			measure: "games",
			range: "7d",
			slice: "market",
			departments: [],
			today: "2026-10-08",
			grain: "range",
		});
		expect(week.range).toBe("7d");
	});
});
