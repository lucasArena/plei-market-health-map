import type { AppSessionHeatmapCellView } from "@market-health-map/core/application";

export interface CachedAppSessionHeatmap {
	expiresAt: number;
	value: Promise<AppSessionHeatmapCellView[]>;
}
