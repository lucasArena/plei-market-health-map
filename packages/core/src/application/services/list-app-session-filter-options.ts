import type { ListAppSessionHeatmapDeps } from "@core/application/services/list-app-session-heatmap.types";

export function makeListAppSessionFilterOptions({
	appSessionHeatmap,
}: Omit<ListAppSessionHeatmapDeps, "clock">) {
	return async function listAppSessionFilterOptions() {
		return appSessionHeatmap.listFilterOptions();
	};
}
