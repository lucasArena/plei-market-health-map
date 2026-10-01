import type {
	AppSessionFilterOptions,
	AppSessionFilters,
} from "@core/application/dtos/app-session-filters-dto.types";
import type { AppSessionHeatmapCellView } from "@core/application/dtos/app-session-heatmap-dto.types";

export interface AppSessionHeatmapRepository {
	listFilterOptions(): Promise<AppSessionFilterOptions>;
	listLast28Days(filters?: AppSessionFilters): Promise<AppSessionHeatmapCellView[]>;
}
