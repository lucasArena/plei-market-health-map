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
