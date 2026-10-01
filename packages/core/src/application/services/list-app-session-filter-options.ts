import type { ListAppSessionHeatmapDeps } from "@core/application/services/list-app-session-heatmap.types";

export function makeListAppSessionFilterOptions({ appSessionHeatmap }: ListAppSessionHeatmapDeps) {
	return () => appSessionHeatmap.listFilterOptions();
}
