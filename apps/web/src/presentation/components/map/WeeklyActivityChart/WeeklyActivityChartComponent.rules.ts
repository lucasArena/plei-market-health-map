import type {
	WeeklyActivityChartView,
	WeeklyActivityPointView,
} from "@/presentation/components/map/WeeklyActivityChart/WeeklyActivityChartComponent.types";

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

export function buildWeeklyActivityChart(
	points: WeeklyActivityPointView[],
): WeeklyActivityChartView {
	const maximum = Math.max(1, ...points.map((point) => point.value));
	const denominator = Math.max(1, points.length - 1);
	const positioned = points.map((point, index) => {
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
	const linePath = positioned
		.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
		.join(" ");
	const areaPath =
		positioned.length > 0 ? `${linePath} L ${RIGHT} ${BOTTOM} L ${LEFT} ${BOTTOM} Z` : "";
	return { areaPath, linePath, points: positioned };
}
