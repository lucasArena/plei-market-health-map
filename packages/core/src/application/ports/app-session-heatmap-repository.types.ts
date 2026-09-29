import type { AppSessionHeatmapCellView } from "@core/application/dtos/app-session-heatmap-dto.types";

export interface AppSessionHeatmapRepository {
	listLast28Days(): Promise<AppSessionHeatmapCellView[]>;
}
