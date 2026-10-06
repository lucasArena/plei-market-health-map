import { makeListAppSessionFilterOptions } from "@core/application/services/list-app-session-filter-options";
import { InMemoryAppSessionHeatmapRepository } from "@core/application/testing/in-memory-app-session-heatmap-repository";

const demographicsOn = async () => ({ enabled: ["player-demographic-filters"] });

it("lists profile options independently of the heatmap", async () => {
	await expect(
		makeListAppSessionFilterOptions({
			appSessionHeatmap: new InMemoryAppSessionHeatmapRepository(),
			enabledFeatureFlags: demographicsOn,
		})(),
	).resolves.toEqual({ genders: [], skills: [], ages: [] });
});

it("returns empty options when demographic filters are disabled", async () => {
	const appSessionHeatmap = new InMemoryAppSessionHeatmapRepository();
	const listFilterOptions = vi.spyOn(appSessionHeatmap, "listFilterOptions");
	await expect(
		makeListAppSessionFilterOptions({
			appSessionHeatmap,
			enabledFeatureFlags: async () => ({ enabled: [] }),
		})(),
	).resolves.toEqual({ genders: [], skills: [], ages: [] });
	expect(listFilterOptions).not.toHaveBeenCalled();
});
