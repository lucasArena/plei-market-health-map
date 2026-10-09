import type {
	DrillDownGrain,
	DrillDownMeasure,
	DrillDownRange,
	DrillDownSegment,
	DrillDownSlice,
	MetricDrillDownView,
} from "@core/application/dtos/metric-drill-down-dto.types";
import type { GameDepartment } from "@core/domain";

export interface MetricDrillDownQuery {
	previousPeriod?: boolean;
	measure: DrillDownMeasure;
	range: DrillDownRange;
	slice: DrillDownSlice;
	segment?: DrillDownSegment;
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
