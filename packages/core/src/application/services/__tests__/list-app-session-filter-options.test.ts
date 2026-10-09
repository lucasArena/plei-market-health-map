import { makeListAppSessionFilterOptions } from "@core/application/services/list-app-session-filter-options";
import { InMemoryAppSessionHeatmapRepository } from "@core/application/testing/in-memory-app-session-heatmap-repository";

it("lists profile options independently of the heatmap", async () => {
	await expect(
		makeListAppSessionFilterOptions({
			appSessionHeatmap: new InMemoryAppSessionHeatmapRepository(),
		})(),
	).resolves.toEqual({ genders: [], skills: [], ages: [] });
});
