import type { RegistrationHeatmapCellView } from "@market-health-map/core/application";

export interface CachedRegistrationHeatmap {
	expiresAt: number;
	value: Promise<RegistrationHeatmapCellView[]>;
}
