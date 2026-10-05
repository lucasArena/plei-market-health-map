import type { AppSessionHeatmapCellView } from "@core/application/dtos/app-session-heatmap-dto.types";
import type { AppSessionHeatmapRepository } from "@core/application/repositories/app-session-heatmap-repository.types";

export class InMemoryAppSessionHeatmapRepository implements AppSessionHeatmapRepository {
	constructor(private readonly cells: AppSessionHeatmapCellView[] = []) {}

	async listFilterOptions() {
		return { genders: [], skills: [], ages: [] };
	}

	async listSessions(): Promise<AppSessionHeatmapCellView[]> {
		return [...this.cells];
	}
}
