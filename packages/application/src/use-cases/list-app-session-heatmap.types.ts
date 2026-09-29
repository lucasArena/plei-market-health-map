import type { AppSessionHeatmapRepository } from "@application/ports/app-session-heatmap-repository.types";

export interface ListAppSessionHeatmapDeps {
	appSessionHeatmap: AppSessionHeatmapRepository;
}
