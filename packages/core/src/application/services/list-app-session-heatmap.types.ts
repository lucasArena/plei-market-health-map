import type { EnabledFeatureFlagsView } from "@core/application/dtos/feature-flags-dto.types";
import type { AppSessionHeatmapRepository } from "@core/application/repositories/app-session-heatmap-repository.types";

export interface ListAppSessionHeatmapDeps {
	appSessionHeatmap: AppSessionHeatmapRepository;
	enabledFeatureFlags: () => Promise<EnabledFeatureFlagsView>;
}
