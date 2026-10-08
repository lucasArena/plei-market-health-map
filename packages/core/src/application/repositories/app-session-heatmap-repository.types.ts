import type {
	AppSessionFilterOptions,
	AppSessionFilters,
} from "@core/application/dtos/app-session-filters-dto.types";
import type { AppSessionHeatmapCellView } from "@core/application/dtos/app-session-heatmap-dto.types";
import type { StatsPeriod } from "@core/application/dtos/facility-detail-dto.types";

export interface AppSessionHeatmapRepository {
	listFilterOptions(): Promise<AppSessionFilterOptions>;
	/** Sessions in the period's full days ending the day before `today` (YYYY-MM-DD). */
	listSessions(
		period: StatsPeriod,
		filters: AppSessionFilters,
		today: string,
	): Promise<AppSessionHeatmapCellView[]>;
}
