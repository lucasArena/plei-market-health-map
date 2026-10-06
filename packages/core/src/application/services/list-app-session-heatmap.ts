import { appSessionFiltersSchema } from "@core/application/dtos/app-session-filters-dto";
import type { AppSessionFilters } from "@core/application/dtos/app-session-filters-dto.types";
import type { AppSessionHeatmapCellView } from "@core/application/dtos/app-session-heatmap-dto.types";
import { DEFAULT_STATS_PERIOD, STATS_PERIODS } from "@core/application/dtos/facility-detail-dto";
import type { StatsPeriod } from "@core/application/dtos/facility-detail-dto.types";
import type { ListAppSessionHeatmapDeps } from "@core/application/services/list-app-session-heatmap.types";
import { z } from "zod";

export function makeListAppSessionHeatmap({ appSessionHeatmap }: ListAppSessionHeatmapDeps) {
	return async function listAppSessionHeatmap(
		filters: AppSessionFilters = {},
		period: StatsPeriod = DEFAULT_STATS_PERIOD,
	): Promise<AppSessionHeatmapCellView[]> {
		return appSessionHeatmap.listSessions(
			z.enum(STATS_PERIODS).parse(period),
			appSessionFiltersSchema.parse(filters),
		);
	};
}
