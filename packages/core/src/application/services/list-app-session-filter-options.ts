import {
	demographicFiltersEnabled,
	EMPTY_APP_SESSION_FILTER_OPTIONS,
} from "@core/application/dtos/app-session-filters-policy";
import type { ListAppSessionHeatmapDeps } from "@core/application/services/list-app-session-heatmap.types";

export function makeListAppSessionFilterOptions({
	appSessionHeatmap,
	enabledFeatureFlags,
}: ListAppSessionHeatmapDeps) {
	return async function listAppSessionFilterOptions() {
		const { enabled } = await enabledFeatureFlags();
		if (!demographicFiltersEnabled(enabled)) {
			return EMPTY_APP_SESSION_FILTER_OPTIONS;
		}
		return appSessionHeatmap.listFilterOptions();
	};
}
