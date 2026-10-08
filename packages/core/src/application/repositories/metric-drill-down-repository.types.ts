import type {
	DrillDownGrain,
	DrillDownMeasure,
	DrillDownRange,
	DrillDownSlice,
	MetricDrillDownView,
} from "@core/application/dtos/metric-drill-down-dto.types";
import type { GameDepartment } from "@core/domain";

export interface MetricDrillDownQuery {
	measure: DrillDownMeasure;
	range: DrillDownRange;
	slice: DrillDownSlice;
	marketId?: string;
	facilityId?: string;
	department?: GameDepartment;
	departments: readonly GameDepartment[];
	today: string;
	grain: DrillDownGrain;
}

export interface MetricDrillDownRepository {
	group(query: MetricDrillDownQuery): Promise<MetricDrillDownView>;
}
