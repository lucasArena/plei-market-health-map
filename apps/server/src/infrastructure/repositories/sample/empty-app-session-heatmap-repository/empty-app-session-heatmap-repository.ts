import type {
	AppSessionHeatmapCellView,
	AppSessionHeatmapRepository,
} from "@market-health-map/core/application";

export class EmptyAppSessionHeatmapRepository implements AppSessionHeatmapRepository {
	async listFilterOptions() {
		return { genders: [], skills: [], ages: [] };
	}

	async listLast28Days(): Promise<AppSessionHeatmapCellView[]> {
		return [];
	}
}
