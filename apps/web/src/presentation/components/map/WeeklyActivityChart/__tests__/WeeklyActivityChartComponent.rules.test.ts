import { buildWeeklyActivityChart } from "@/presentation/components/map/WeeklyActivityChart/WeeklyActivityChartComponent.rules";

const POINTS = [
	{
		key: "one",
		label: "Sep 7",
		shortLabel: "Sep 7",
		value: 5,
		valueLabel: "5 games",
		tooltip: "Sep 7: 5 games",
	},
	{
		key: "two",
		label: "Sep 14",
		shortLabel: "Sep 14",
		value: 10,
		valueLabel: "10 games",
		tooltip: "Sep 14: 10 games",
	},
];

describe("buildWeeklyActivityChart", () => {
	it("positions points and creates line and area paths", () => {
		const chart = buildWeeklyActivityChart(POINTS);
		expect(chart.points).toHaveLength(2);
		expect(chart.points[0]).toMatchObject({ x: 10, y: 47, tooltipClass: "left-0 translate-x-0" });
		expect(chart.points[1]).toMatchObject({
			x: 310,
			y: 12,
			tooltipClass: "right-0 left-auto translate-x-0",
		});
		expect(chart.linePath).toBe("M 10 47 L 310 12");
		expect(chart.areaPath).toContain("L 310 82 L 10 82 Z");
	});

	it("handles an empty or single-point series and centers middle tooltips", () => {
		expect(buildWeeklyActivityChart([])).toMatchObject({ linePath: "", areaPath: "" });
		expect(buildWeeklyActivityChart(POINTS.slice(0, 1)).points[0]).toMatchObject({
			x: 10,
			tooltipClass: "left-0 translate-x-0",
		});
		const middle = buildWeeklyActivityChart([
			...POINTS,
			{
				key: "three",
				label: "Sep 21",
				shortLabel: "Sep 21",
				value: 8,
				valueLabel: "8 games",
				tooltip: "Sep 21: 8 games",
			},
		]);
		expect(middle.points[1]?.tooltipClass).toBe("left-1/2 -translate-x-1/2");
	});
});
