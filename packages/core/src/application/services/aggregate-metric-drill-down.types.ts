import type {
	DrillDownMeasure,
	DrillDownSlice,
	MetricDrillDownRow,
	MetricDrillDownView,
} from "@core/application/dtos/metric-drill-down-dto.types";
import type { GameDepartment, GameDepartmentCounts } from "@core/domain";

export interface DrillDownFacilityFact {
	id: string;
	name: string;
	marketId: string;
	marketName: string;
	games: number | null;
	gamesByDepartment: GameDepartmentCounts | null;
}

export interface AggregateCountDrillDownInput {
	facilities: readonly DrillDownFacilityFact[];
	measure: DrillDownMeasure;
	slice: DrillDownSlice;
	marketId?: string;
	facilityId?: string;
	department?: GameDepartment;
	gameDepartments?: readonly GameDepartment[];
	start: string;
	end: string;
	range: MetricDrillDownView["range"];
}

export interface DistinctCountContribution {
	id: string;
	name: string;
	memberKeys: readonly string[];
	departments?: Partial<Record<GameDepartment, readonly string[]>> | null;
}

export interface RateContribution {
	id: string;
	name: string;
	numerator: number | null;
	denominator: number | null;
	departments?: Partial<
		Record<GameDepartment, { numerator: number | null; denominator: number | null }>
	> | null;
}

export type { MetricDrillDownRow };
