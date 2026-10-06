import {
	isMapLayersCustomized,
	MAP_LAYERS_DEFAULTS,
} from "@/presentation/components/map/MapLayersPanel/MapLayersPanelComponent.defaults";

describe("MAP_LAYERS_DEFAULTS", () => {
	it("starts with inactive facilities hidden, every other layer on and no player filter", () => {
		expect(MAP_LAYERS_DEFAULTS).toEqual({
			showActiveFacilities: true,
			showInactiveFacilities: false,
			showGamesTrend: false,
			showSessions: true,
			sessionFilters: {},
		});
	});
});

describe("isMapLayersCustomized", () => {
	it("is false for the defaults", () => {
		expect(isMapLayersCustomized(MAP_LAYERS_DEFAULTS)).toBe(false);
	});

	it.each([
		["showActiveFacilities"],
		["showInactiveFacilities"],
		["showGamesTrend"],
		["showSessions"],
	] as const)("is true when %s differs from the default", (key) => {
		expect(
			isMapLayersCustomized({ ...MAP_LAYERS_DEFAULTS, [key]: !MAP_LAYERS_DEFAULTS[key] }),
		).toBe(true);
	});

	it("is true only while a player filter has a value", () => {
		expect(
			isMapLayersCustomized({ ...MAP_LAYERS_DEFAULTS, sessionFilters: { gender: "Female" } }),
		).toBe(true);
		expect(
			isMapLayersCustomized({ ...MAP_LAYERS_DEFAULTS, sessionFilters: { gender: undefined } }),
		).toBe(false);
	});
});
