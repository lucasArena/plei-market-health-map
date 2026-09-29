import type { AppSessionHeatmapCellView } from "@application/dtos/app-session-heatmap-dto.types";
import type { ListAppSessionHeatmapDeps } from "@application/use-cases/list-app-session-heatmap.types";

export function makeListAppSessionHeatmap({ appSessionHeatmap }: ListAppSessionHeatmapDeps) {
	return async function listAppSessionHeatmap(): Promise<AppSessionHeatmapCellView[]> {
		return appSessionHeatmap.listLast28Days();
	};
}
