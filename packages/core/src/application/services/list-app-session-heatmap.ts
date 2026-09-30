import type { AppSessionHeatmapCellView } from "@core/application/dtos/app-session-heatmap-dto.types";
import type { ListAppSessionHeatmapDeps } from "@core/application/services/list-app-session-heatmap.types";

export function makeListAppSessionHeatmap({ appSessionHeatmap }: ListAppSessionHeatmapDeps) {
	return async function listAppSessionHeatmap(): Promise<AppSessionHeatmapCellView[]> {
		return appSessionHeatmap.listLast28Days();
	};
}
