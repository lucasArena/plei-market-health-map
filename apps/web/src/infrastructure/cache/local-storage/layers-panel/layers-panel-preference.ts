import type { ResolveStorage } from "@/infrastructure/cache/local-storage/layers-panel/layers-panel-preference.types";

export const LAYERS_PANEL_OPEN_KEY = "market-health-map:layers-panel:open";

function browserStorage(): Storage | null {
	try {
		return window.localStorage;
	} catch {
		return null;
	}
}

export class LayersPanelPreference {
	constructor(private readonly resolveStorage: ResolveStorage = browserStorage) {}

	isOpen(): boolean {
		try {
			return this.resolveStorage()?.getItem(LAYERS_PANEL_OPEN_KEY) === "true";
		} catch {
			return false;
		}
	}

	remember(isOpen: boolean): void {
		try {
			this.resolveStorage()?.setItem(LAYERS_PANEL_OPEN_KEY, String(isOpen));
		} catch {
			return;
		}
	}
}

export const layersPanelPreference = new LayersPanelPreference();
