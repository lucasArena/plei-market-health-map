export interface WeeklyActivityPointView {
	key: string;
	label: string;
	shortLabel: string;
	value: number;
	valueLabel: string;
	tooltip: string;
}

export interface WeeklyActivitySeries {
	legend: string;
	points: WeeklyActivityPointView[];
}

export interface WeeklyActivityChartProps {
	title: string;
	legend: string;
	points: WeeklyActivityPointView[];
	secondary?: WeeklyActivitySeries;
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
	secondaryLinePath: string;
	secondaryPoints: PositionedWeeklyActivityPoint[];
}

export interface ChartPointsProps {
	points: PositionedWeeklyActivityPoint[];
	dotClass: string;
}
