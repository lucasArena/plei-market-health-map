import { appSessionFiltersSchema } from "@core/application/dtos/app-session-filters-dto";
import type { AppSessionFilters } from "@core/application/dtos/app-session-filters-dto.types";
import type { AppSessionHeatmapCellView } from "@core/application/dtos/app-session-heatmap-dto.types";
import type { ListAppSessionHeatmapDeps } from "@core/application/services/list-app-session-heatmap.types";

export function makeListAppSessionHeatmap({ appSessionHeatmap }: ListAppSessionHeatmapDeps) {
	return async function listAppSessionHeatmap(
		filters: AppSessionFilters = {},
	): Promise<AppSessionHeatmapCellView[]> {
		return appSessionHeatmap.listLast28Days(appSessionFiltersSchema.parse(filters));
	};
}
