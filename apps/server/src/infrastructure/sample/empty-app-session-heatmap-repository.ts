import type {
	AppSessionHeatmapCellView,
	AppSessionHeatmapRepository,
} from "@market-health-map/core/application";

export class EmptyAppSessionHeatmapRepository implements AppSessionHeatmapRepository {
	async listLast28Days(): Promise<AppSessionHeatmapCellView[]> {
		return [];
	}
}
