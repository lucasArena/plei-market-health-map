import type { GameDepartment, GameDepartmentCounts } from "@core/domain";

export const DRILL_DOWN_RANGES = ["7d", "28d", "90d", "6m", "12m"] as const;
export type DrillDownRange = (typeof DRILL_DOWN_RANGES)[number];

export const DRILL_DOWN_RANGE_DAYS = {
	"7d": 7,
	"28d": 28,
	"90d": 90,
	"6m": 180,
	"12m": 365,
} as const satisfies Record<DrillDownRange, number>;

export const DRILL_DOWN_MEASURES = ["games", "active-facilities"] as const;
export type DrillDownMeasure = (typeof DRILL_DOWN_MEASURES)[number];

export const DRILL_DOWN_SLICES = ["market", "facility", "department"] as const;
export type DrillDownSlice = (typeof DRILL_DOWN_SLICES)[number];

export const DRILL_DOWN_SEGMENTS = ["none", "department"] as const;
export type DrillDownSegment = (typeof DRILL_DOWN_SEGMENTS)[number];

export const DRILL_DOWN_MEASURE_KINDS = ["count", "distinct-count", "rate"] as const;
export type DrillDownMeasureKind = (typeof DRILL_DOWN_MEASURE_KINDS)[number];

export const DRILL_DOWN_MEASURE_KIND = {
	games: "count",
	"active-facilities": "count",
} as const satisfies Record<DrillDownMeasure, DrillDownMeasureKind>;

export const DRILL_DOWN_GRAINS = ["range"] as const;
export type DrillDownGrain = (typeof DRILL_DOWN_GRAINS)[number];

export interface GetMetricDrillDownInput {
	measure: DrillDownMeasure;
	range: DrillDownRange;
	slice: DrillDownSlice;
	segment?: DrillDownSegment;
	marketId?: string;
	facilityId?: string;
	department?: GameDepartment;
	departments?: readonly GameDepartment[];
	timeZone?: string;
	grain?: DrillDownGrain;
}

export interface MetricDrillDownRow {
	id: string;
	name: string;
	value: number | null;
	departments: GameDepartmentCounts | null;
	numerator?: number | null;
	denominator?: number | null;
}

export interface MetricDrillDownView {
	total: number | null;
	rows: MetricDrillDownRow[];
	start: string;
	end: string;
	measure: DrillDownMeasure;
	range: DrillDownRange;
	kind: DrillDownMeasureKind;
}
