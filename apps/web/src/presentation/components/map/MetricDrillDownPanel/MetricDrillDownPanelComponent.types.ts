import type {
	DrillDownMeasure,
	DrillDownSegment,
	DrillDownSlice,
	MetricDrillDownRow,
} from "@market-health-map/core/application";
import type { GameDepartment } from "@market-health-map/core/domain";
import type { RefObject } from "react";

export interface MetricDrillDownPanelProps {
	isOpen: boolean;
	isClosing?: boolean;
	onClosed?(): void;
	onClose(): void;
	triggerRef: RefObject<HTMLButtonElement | null>;
}
export interface MetricDrillDownSelection {
	measure: DrillDownMeasure;
	slice: DrillDownSlice;
	segment: DrillDownSegment;
	marketId?: string;
	marketName?: string;
	department?: GameDepartment;
}
export type DrillDownSort = "count-desc" | "count-asc" | "name-asc" | "name-desc";

export interface DrillDownChartBar {
	id: GameDepartment | "total";
	label: string;
	value: number;
	height: number;
	department?: GameDepartment;
}
export interface DrillDownChartRow extends MetricDrillDownRow {
	bars: DrillDownChartBar[];
}
