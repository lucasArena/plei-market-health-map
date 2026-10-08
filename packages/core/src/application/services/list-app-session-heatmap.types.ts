import type { EnabledFeatureFlagsView } from "@core/application/dtos/feature-flags-dto.types";
import type { Clock } from "@core/application/providers/clock.types";
import type { AppSessionHeatmapRepository } from "@core/application/repositories/app-session-heatmap-repository.types";

export interface ListAppSessionHeatmapDeps {
	/** Reads now, so today is resolved in the viewer's time zone on each call. */
	clock: Clock;
	appSessionHeatmap: AppSessionHeatmapRepository;
	enabledFeatureFlags: () => Promise<EnabledFeatureFlagsView>;
}
