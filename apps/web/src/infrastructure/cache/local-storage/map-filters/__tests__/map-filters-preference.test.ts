import {
	MAP_FILTERS_KEY,
	mapFiltersSchema,
} from "@/infrastructure/cache/local-storage/map-filters/map-filters-preference";

const FILTERS = {
	showActiveFacilities: true,
	showInactiveFacilities: false,
	showGamesTrend: true,
	showSessions: true,
	demandMetric: "registrations",
	supplyMetric: "games",
	gameDepartments: ["magic"],
	demandFiltersPresent: true,
	supplyFiltersPresent: true,
	sessionFilters: { gender: ["male"], ageMin: 18 },
};

describe("map filters preference", () => {
	it("accepts the Layers state and rejects unknown departments or metrics", () => {
		expect(MAP_FILTERS_KEY).toBe("market-health-map:map-filters");
		expect(mapFiltersSchema.safeParse(FILTERS).success).toBe(true);
		expect(mapFiltersSchema.safeParse({ ...FILTERS, gameDepartments: ["bowling"] }).success).toBe(
			false,
		);
		expect(mapFiltersSchema.safeParse({ ...FILTERS, supplyMetric: "players" }).success).toBe(false);
		expect(
			mapFiltersSchema.safeParse({ ...FILTERS, sessionFilters: { ageMin: 400 } }).success,
		).toBe(false);
	});
});
