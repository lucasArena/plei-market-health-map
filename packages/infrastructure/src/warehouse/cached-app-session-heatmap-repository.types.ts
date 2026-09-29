import type { AppSessionHeatmapCellView } from "@market-health-map/application";

export interface CachedAppSessionHeatmap {
	expiresAt: number;
	value: Promise<AppSessionHeatmapCellView[]>;
}
