import { makeListAppSessionHeatmap } from "@core/application/services/list-app-session-heatmap";
import { InMemoryAppSessionHeatmapRepository } from "@core/application/testing/in-memory-app-session-heatmap-repository";

const CELL = { lat: 29.746, lng: -95.352, sessionWeight: 1134 };

describe("listAppSessionHeatmap", () => {
	it("returns every app-session heatmap cell", async () => {
		const listAppSessionHeatmap = makeListAppSessionHeatmap({
			appSessionHeatmap: new InMemoryAppSessionHeatmapRepository([CELL]),
		});

		await expect(listAppSessionHeatmap()).resolves.toEqual([CELL]);
	});

	it("returns an empty list when there are no cells", async () => {
		const listAppSessionHeatmap = makeListAppSessionHeatmap({
			appSessionHeatmap: new InMemoryAppSessionHeatmapRepository(),
		});
		await expect(listAppSessionHeatmap()).resolves.toEqual([]);
	});
});

it("validates and forwards the complete cohort to storage", async () => {
	const listSessions = vi.fn().mockResolvedValue([]);
	const list = makeListAppSessionHeatmap({
		appSessionHeatmap: { listSessions, listFilterOptions: vi.fn() },
	});
	await list({ gender: " Female ", skill: "Advanced", ageMin: 25, ageMax: 34 });
	expect(listSessions).toHaveBeenCalledWith("week", {
		gender: "Female",
		skill: "Advanced",
		ageMin: 25,
		ageMax: 34,
	});
	await expect(list({ ageMin: 40, ageMax: 18 })).rejects.toThrow();
	expect(listSessions).toHaveBeenCalledTimes(1);
});
