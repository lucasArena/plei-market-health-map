import type { AppSessionHeatmapRepository } from "@core/application/ports/app-session-heatmap-repository.types";

export interface ListAppSessionHeatmapDeps {
	appSessionHeatmap: AppSessionHeatmapRepository;
}
