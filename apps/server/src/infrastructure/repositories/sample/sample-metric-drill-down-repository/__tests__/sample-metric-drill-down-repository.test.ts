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
		const scheduled = await repository.group({
			measure: "scheduled-games",
			range: "28d",
			slice: "market",
			departments: [],
			today: "2026-10-08",
			grain: "range",
		});
		expect(scheduled.kind).toBe("count");
		expect(scheduled.measure).toBe("scheduled-games");
		const rate = await repository.group({
			measure: "confirmation-rate",
			range: "7d",
			slice: "facility",
			departments: [],
			today: "2026-10-08",
			grain: "range",
		});
		expect(rate.kind).toBe("rate");
		expect(rate.rows.every((row) => row.value === null || row.value === 100)).toBe(true);
		const organizers = await repository.group({
			measure: "games",
			range: "28d",
			slice: "organizer",
			departments: [],
			today: "2026-10-08",
			grain: "range",
		});
		expect(organizers.rows.every((row) => row.id.startsWith("org-"))).toBe(true);
	});

	it("returns sample almost-filled and incident measures", async () => {
		const repository = new SampleMetricDrillDownRepository(new SampleFacilityRepository());
		const base = { range: "28d", departments: [], today: "2026-10-08", grain: "range" } as const;
		const almostFilled = await repository.group({
			...base,
			measure: "almost-filled-rate",
			slice: "department",
		});
		expect(almostFilled.kind).toBe("rate");
		expect(almostFilled.dataErrors).toBe(0);
		const incidentRate = await repository.group({
			...base,
			measure: "incident-games-rate",
			slice: "market",
		});
		expect(incidentRate.kind).toBe("rate");
		expect(incidentRate.numerator).not.toBeNull();
	});
});

it.each(["app-sessions", "registrations", "unique-users"] as const)(
	"does not fabricate %s without warehouse data",
	async (measure) => {
		const repository = new SampleMetricDrillDownRepository(new SampleFacilityRepository());
		expect(
			await repository.group({
				measure,
				range: "7d",
				slice: "market",
				departments: [],
				today: "2026-10-08",
				grain: "range",
			}),
		).toMatchObject({ measure, total: null, rows: [] });
	},
);
