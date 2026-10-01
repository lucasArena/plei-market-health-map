import {
	LAYERS_PANEL_OPEN_KEY,
	LayersPanelPreference,
	layersPanelPreference,
} from "@/infrastructure/cache/local-storage/layers-panel/layers-panel-preference";

describe("LayersPanelPreference", () => {
	beforeEach(() => localStorage.clear());

	it("is closed until the person leaves the panel open", () => {
		expect(layersPanelPreference.isOpen()).toBe(false);

		layersPanelPreference.remember(true);
		expect(localStorage.getItem(LAYERS_PANEL_OPEN_KEY)).toBe("true");
		expect(new LayersPanelPreference().isOpen()).toBe(true);

		layersPanelPreference.remember(false);
		expect(new LayersPanelPreference().isOpen()).toBe(false);
	});

	it("stays closed and quiet when storage is missing or throws", () => {
		const missing = new LayersPanelPreference(() => null);
		const throwing = new LayersPanelPreference(() => {
			throw new Error("blocked");
		});

		missing.remember(true);
		throwing.remember(true);
		expect(missing.isOpen()).toBe(false);
		expect(throwing.isOpen()).toBe(false);
	});
});
