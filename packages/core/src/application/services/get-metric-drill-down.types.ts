import type { EnabledFeatureFlagsView } from "@core/application/dtos/feature-flags-dto.types";
import type { Clock } from "@core/application/providers/clock.types";
import type { MetricDrillDownRepository } from "@core/application/repositories/metric-drill-down-repository.types";

export type {
	DrillDownMeasure,
	DrillDownSegment,
	DrillDownSlice,
	GetMetricDrillDownInput,
	MetricDrillDownRow,
	MetricDrillDownView,
} from "@core/application/dtos/metric-drill-down-dto.types";

export interface GetMetricDrillDownDeps {
	drillDown: MetricDrillDownRepository;
	clock: Clock;
	enabledFeatureFlags: () => Promise<EnabledFeatureFlagsView>;
}
