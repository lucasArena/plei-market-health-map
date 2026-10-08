import type { StatsPeriod } from "@core/application/dtos/facility-detail-dto.types";
import type { FacilityPointView } from "@core/application/dtos/facility-dto.types";
import type { GameDepartment, GameDepartmentCounts } from "@core/domain";

export type DrillDownMeasure = "games" | "active-facilities";
export type DrillDownSlice = "market" | "facility" | "department";
export type DrillDownSegment = "none" | "department";
export interface MetricDrillDownInput {
	facilities: readonly FacilityPointView[];
	period: StatsPeriod;
	measure: DrillDownMeasure;
	slice: DrillDownSlice;
	segment: DrillDownSegment;
	marketId?: string;
	facilityId?: string;
	department?: GameDepartment;
	gameDepartments?: readonly GameDepartment[];
	now: Date;
	timeZone: string;
}
export interface MetricDrillDownRow {
	id: string;
	name: string;
	value: number | null;
	departments: GameDepartmentCounts | null;
}
export interface MetricDrillDownView {
	total: number | null;
	rows: MetricDrillDownRow[];
	start: string;
	end: string;
}
