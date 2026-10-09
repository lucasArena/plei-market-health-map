import type {
	MetricRowView,
	MetricTone,
} from "@/presentation/components/displays/MetricRows/MetricRowsComponent.types";

export type GamesTrendDirection = "up" | "down" | "flat";

export interface GamesTrendPointView {
	key: string;
	value: number;
	valueLabel: string;
	weekLabel: string;
	tooltipLabel: string;
	ariaLabel: string;
	isCurrentPeriod: boolean;
}

export interface GamesTrendChangeView {
	label: string;
	direction: GamesTrendDirection;
}

export type GamesMetricTone = MetricTone;

export type GamesMetricView = MetricRowView;

export interface GamesTrendView {
	label?: string;
	total: string;
	change: GamesTrendChangeView | null;
	comparison: string;
	direction: GamesTrendDirection;
	axisMax: number | null;
	axisLabel: string | null;
	points: GamesTrendPointView[];
	metrics: GamesMetricView[];
}

export interface GamesTrendChartProps {
	view: GamesTrendView;
	testId?: string;
	metricsTestId?: string;
}

export interface ChartPoint {
	x: number;
	y: number;
}

export interface GamesTrendGeometry {
	linePath: string;
	areaPath: string;
	axisY: number | null;
	points: ChartPoint[];
}

export interface GamesTrendColors {
	line: string;
	area: string;
	halo: string;
	dot: string;
	pill: string;
	text: string;
}

export type TooltipAlign = "start" | "center" | "end";

export type TooltipPlacement = "above" | "below";
