export interface WeeklyActivityPointView {
	key: string;
	label: string;
	shortLabel: string;
	value: number;
	valueLabel: string;
	tooltip: string;
}

export interface WeeklyActivityChartProps {
	title: string;
	legend: string;
	points: WeeklyActivityPointView[];
}

export interface PositionedWeeklyActivityPoint extends WeeklyActivityPointView {
	x: number;
	y: number;
	left: string;
	top: string;
	tooltipClass: string;
}

export interface WeeklyActivityChartView {
	areaPath: string;
	linePath: string;
	points: PositionedWeeklyActivityPoint[];
}
