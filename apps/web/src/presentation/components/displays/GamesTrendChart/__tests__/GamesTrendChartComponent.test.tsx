import { fireEvent, render, screen } from "@testing-library/react";
import { GamesTrendChart } from "@/presentation/components/displays/GamesTrendChart/GamesTrendChartComponent";
import {
	axisLineStart,
	buildGeometry,
	niceAxisMax,
	smoothPath,
	tooltipAlign,
} from "@/presentation/components/displays/GamesTrendChart/GamesTrendChartComponent.rules";
import type { GamesTrendView } from "@/presentation/components/displays/GamesTrendChart/GamesTrendChartComponent.types";

const VALUES = [46, 45, 44, 43, 45, 44, 42, 41];
const WEEKS = ["Aug 12", "Aug 19", "Aug 26", "Sep 2", "Sep 9", "Sep 16", "Sep 23", "Sep 30"];

const VIEW: GamesTrendView = {
	total: "172",
	change: { label: "−3%", direction: "down" },
	comparison: "vs 178 in the previous 28 days",
	direction: "down",
	axisMax: 50,
	axisLabel: "50",
	metrics: [
		{
			key: "confirmation",
			label: "Confirmation rate",
			value: "75%",
			previous: "vs 83%",
			change: { label: "−8 pts", direction: "down", tone: "bad" },
		},
		{
			key: "cancellation",
			label: "Cancellation rate",
			value: "11%",
			previous: "vs 6%",
			change: { label: "+5 pts", direction: "up", tone: "bad" },
		},
		{ key: "posted", label: "Games posted", value: "64", previous: "vs 72", change: null },
	],
	points: VALUES.map((value, index) => ({
		key: `w${index}`,
		value,
		valueLabel: String(value),
		weekLabel: WEEKS[index] ?? "",
		tooltipLabel: `games · ${WEEKS[index]}`,
		ariaLabel: `${value} games, week ending ${WEEKS[index]}`,
		isCurrentPeriod: index >= 4,
	})),
};

describe("GamesTrendChart rules", () => {
	it("scales the line from zero on the baseline to the axis maximum on the gridline", () => {
		const geometry = buildGeometry([10, 20], null);

		expect(geometry.points).toEqual([
			{ x: 94, y: 50 },
			{ x: 282, y: 15 },
		]);
		expect(geometry.axisY).toBeNull();
		expect(geometry.areaPath).toMatch(/Z$/);
		const withAxis = buildGeometry([41, 50], 50);
		expect(withAxis.axisY).toBe(15);
		expect(withAxis.points.map((item) => item.y)).toEqual([27.6, 15]);
		expect(buildGeometry([0, 0], null).points.map((item) => item.y)).toEqual([85, 85]);
	});

	it("starts the gridline after its label", () => {
		expect(axisLineStart("50")).toBe(24);
		expect(axisLineStart("1,500")).toBe(45);
		expect(axisLineStart(null)).toBe(0);
	});

	it("rounds the axis up to a readable value", () => {
		expect(niceAxisMax([41, 46])).toBe(50);
		expect(niceAxisMax([1169, 1339])).toBe(1500);
		expect(niceAxisMax([3])).toBe(3);
		expect(niceAxisMax([0, 0])).toBeNull();
	});

	it("draws a smooth curve through every point", () => {
		expect(smoothPath([])).toBe("");
		expect(smoothPath([{ x: 0, y: 10 }])).toBe("M 0 10");
		expect(
			smoothPath([
				{ x: 0, y: 10 },
				{ x: 10, y: 20 },
				{ x: 20, y: 10 },
			]),
		).toMatch(/^M 0 10 C .* 10 20 C .* 20 10$/);
		expect(buildGeometry([], null).areaPath).toBe("");
	});

	it("keeps the tooltip inside the chart at both edges", () => {
		expect(tooltipAlign(0, 8)).toBe("start");
		expect(tooltipAlign(3, 8)).toBe("center");
		expect(tooltipAlign(6, 8)).toBe("end");
	});
});

describe("GamesTrendChart", () => {
	it("shows the period total, its change, the weekly line and the game rates", () => {
		render(<GamesTrendChart view={VIEW} />);

		expect(screen.getByText("172")).toBeInTheDocument();
		expect(screen.getByText("−3%")).toHaveClass("bg-[#fee2e2]");
		expect(screen.getByText("vs 178 in the previous 28 days")).toBeInTheDocument();
		expect(screen.getByTestId("games-trend-axis")).toBeInTheDocument();
		expect(screen.getByTestId("games-trend-baseline")).toBeInTheDocument();
		expect(screen.getByText("0")).toBeInTheDocument();
		expect(screen.getByText("50")).toBeInTheDocument();
		expect(screen.getByTestId("games-trend-tooltip")).toHaveTextContent("41games · Sep 30");
		expect(screen.getByText("Sep 30")).toHaveClass("text-[rgba(60,60,67,0.6)]");
		expect(screen.getByText("Aug 12")).toHaveClass("text-[rgba(60,60,67,0.3)]");
		expect(screen.getByText("Confirmation rate")).toBeInTheDocument();
		expect(screen.getByText("vs 83%")).toBeInTheDocument();
		expect(screen.getByText("−8 pts")).toHaveClass("bg-[#fee2e2]");
		expect(screen.getByText("+5 pts")).toHaveClass("text-[#b91c1c]");
		expect(screen.getByText("Games posted").closest("div")).toHaveTextContent(
			"Games posted64vs 72",
		);
	});

	it("moves the tooltip with the pointer or focus and returns to the latest week", () => {
		render(<GamesTrendChart view={VIEW} />);
		const firstWeek = screen.getByRole("button", { name: "46 games, week ending Aug 12" });

		fireEvent.mouseEnter(firstWeek);
		expect(screen.getByTestId("games-trend-tooltip")).toHaveTextContent("46games · Aug 12");
		expect(firstWeek).toHaveAttribute("aria-pressed", "true");

		fireEvent.mouseLeave(firstWeek);
		expect(screen.getByTestId("games-trend-tooltip")).toHaveTextContent("41games · Sep 30");

		fireEvent.focus(screen.getByRole("button", { name: "43 games, week ending Sep 2" }));
		expect(screen.getByTestId("games-trend-tooltip")).toHaveTextContent("43games · Sep 2");
	});

	it("leaves out the axis, change and rates when they are unknown", () => {
		render(
			<GamesTrendChart
				view={{
					...VIEW,
					change: null,
					direction: "flat",
					axisMax: null,
					axisLabel: null,
					metrics: [],
				}}
			/>,
		);

		expect(screen.queryByTestId("games-trend-axis")).not.toBeInTheDocument();
		expect(screen.queryByText("−3%")).not.toBeInTheDocument();
		expect(screen.queryByTestId("games-metrics")).not.toBeInTheDocument();
	});
});
