import type {
	PositionedWeeklyActivityPoint,
	WeeklyActivityChartView,
	WeeklyActivityPointView,
} from "@/presentation/components/displays/WeeklyActivityChart/WeeklyActivityChartComponent.types";

const WIDTH = 320;
const HEIGHT = 112;
const LEFT = 10;
const RIGHT = 310;
const TOP = 12;
const BOTTOM = 82;

export function edgeTooltipClass(index: number, count: number): string {
	const tooltipClass = {
		[`${true}`]: "left-1/2 -translate-x-1/2",
		[`${index === count - 1}`]: "right-0 left-auto translate-x-0",
		[`${index === 0}`]: "left-0 translate-x-0",
	}.true;
	return tooltipClass as string;
}

function positionPoints(
	points: WeeklyActivityPointView[],
	maximum: number,
): PositionedWeeklyActivityPoint[] {
	const denominator = Math.max(1, points.length - 1);
	return points.map((point, index) => {
		const x = LEFT + (index / denominator) * (RIGHT - LEFT);
		const y = BOTTOM - (point.value / maximum) * (BOTTOM - TOP);
		return {
			...point,
			x,
			y,
			left: `${(x / WIDTH) * 100}%`,
			top: `${(y / HEIGHT) * 100}%`,
			tooltipClass: edgeTooltipClass(index, points.length),
		};
	});
}

function linePathOf(points: PositionedWeeklyActivityPoint[]): string {
	return points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
}

export function buildWeeklyActivityChart(
	points: WeeklyActivityPointView[],
	secondary: WeeklyActivityPointView[] = [],
): WeeklyActivityChartView {
	const maximum = Math.max(1, ...[...points, ...secondary].map((point) => point.value));
	const positioned = positionPoints(points, maximum);
	const secondaryPoints = positionPoints(secondary, maximum);
	const linePath = linePathOf(positioned);
	const areaPath =
		positioned.length > 0 ? `${linePath} L ${RIGHT} ${BOTTOM} L ${LEFT} ${BOTTOM} Z` : "";
	return {
		areaPath,
		linePath,
		points: positioned,
		secondaryLinePath: linePathOf(secondaryPoints),
		secondaryPoints,
	};
}
