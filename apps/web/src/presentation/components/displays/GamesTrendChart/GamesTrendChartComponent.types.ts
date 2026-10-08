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

export interface GamesTrendView {
	total: string;
	change: GamesTrendChangeView | null;
	comparison: string;
	direction: GamesTrendDirection;
	benchmark: number | null;
	benchmarkLabel: string | null;
	benchmarkHint: string;
	rangeLabel: string | null;
	points: GamesTrendPointView[];
}

export interface GamesTrendChartProps {
	view: GamesTrendView;
}

export interface ChartPoint {
	x: number;
	y: number;
}

export interface GamesTrendGeometry {
	linePath: string;
	areaPath: string;
	benchmarkY: number | null;
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
