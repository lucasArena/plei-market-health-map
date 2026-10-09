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
}
export interface MetricDrillDownFocus {
	rowId: string;
	department?: GameDepartment;
	organizerId?: string;
}
export type DrillDownSort =
	| "count-desc"
	| "count-asc"
	| "name-asc"
	| "name-desc"
	| "change-asc"
	| "change-desc";

export interface DrillDownChartBar {
	id: string;
	label: string;
	value: number;
	height: number;
	isTop: boolean;
	color: string;
	department?: GameDepartment;
	organizerId?: string;
}
export interface DrillDownChartRow extends MetricDrillDownRow {
	bars: DrillDownChartBar[];
}
