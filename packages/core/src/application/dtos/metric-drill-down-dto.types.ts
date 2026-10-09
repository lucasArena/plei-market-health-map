import type { GameDepartment } from "@core/domain";

export const DRILL_DOWN_COMPARISONS = ["previous-period", "week", "month", "year"] as const;
export type DrillDownComparison = (typeof DRILL_DOWN_COMPARISONS)[number];

export const DRILL_DOWN_RANGES = ["7d", "28d", "90d", "6m", "12m"] as const;
export type DrillDownRange = (typeof DRILL_DOWN_RANGES)[number];

export const DRILL_DOWN_RANGE_DAYS = {
	"7d": 7,
	"28d": 28,
	"90d": 90,
	"6m": 180,
	"12m": 365,
} as const satisfies Record<DrillDownRange, number>;

export const DRILL_DOWN_MEASURES = [
	"games",
	"avg-daily-games",
	"scheduled-games",
	"incident-games-rate",
	"confirmation-rate",
	"almost-filled-rate",
	"registrations",
	"unique-users",
	"activated-players",
	"unique-players",
	"active-organizers",
	"active-facilities",
	"app-sessions",
] as const;
export type DrillDownMeasure = (typeof DRILL_DOWN_MEASURES)[number];

export const DRILL_DOWN_SLICES = ["market", "facility", "department", "organizer", "time"] as const;
export type DrillDownSlice = (typeof DRILL_DOWN_SLICES)[number];

export const DRILL_DOWN_SEGMENTS = ["none", "department", "organizer"] as const;
export type DrillDownSegment = (typeof DRILL_DOWN_SEGMENTS)[number];

export const DRILL_DOWN_MEASURE_KINDS = ["count", "distinct-count", "rate"] as const;
export type DrillDownMeasureKind = (typeof DRILL_DOWN_MEASURE_KINDS)[number];

export const DRILL_DOWN_MEASURE_KIND = {
	"app-sessions": "count",
	registrations: "distinct-count",
	"unique-users": "distinct-count",
	games: "count",
	"avg-daily-games": "count",
	"active-organizers": "distinct-count",
	"active-facilities": "count",
	"scheduled-games": "count",
	"confirmation-rate": "rate",
	"unique-players": "distinct-count",
	"activated-players": "distinct-count",
	"almost-filled-rate": "rate",
	"incident-games-rate": "rate",
} as const satisfies Record<DrillDownMeasure, DrillDownMeasureKind>;

export const DRILL_DOWN_GRAINS = ["range", "day", "week", "month"] as const;
export type DrillDownGrain = (typeof DRILL_DOWN_GRAINS)[number];

export interface GetMetricDrillDownInput {
	comparison?: DrillDownComparison;
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

export interface MetricDrillDownRateParts {
	numerator: number | null;
	denominator: number | null;
	dataErrors?: number;
}

export interface MetricDrillDownOrganizer {
	id: string;
	name: string;
	value: number | null;
	previousValue?: number | null;
	numerator?: number | null;
	denominator?: number | null;
	dataErrors?: number;
	facilityIds?: string[];
}

export interface MetricDrillDownRow {
	previousValue?: number | null;
	previousDepartments?: Record<GameDepartment, number | null> | null;
	id: string;
	name: string;
	bucketStart?: string;
	bucketEnd?: string;
	partial?: boolean;
	facilityIds?: string[];
	departmentFacilityIds?: Partial<Record<GameDepartment, string[]>>;
	departmentParts?: Partial<Record<GameDepartment, MetricDrillDownRateParts>>;
	value: number | null;
	departments: Record<GameDepartment, number | null> | null;
	organizers?: MetricDrillDownOrganizer[] | null;
	numerator?: number | null;
	denominator?: number | null;
	dataErrors?: number;
}

export interface MetricDrillDownView {
	previousTotal?: number | null;
	previousStart?: string;
	previousEnd?: string;
	total: number | null;
	rows: MetricDrillDownRow[];
	numerator?: number | null;
	denominator?: number | null;
	dataErrors?: number;
	start: string;
	end: string;
	measure: DrillDownMeasure;
	range: DrillDownRange;
	kind: DrillDownMeasureKind;
}
