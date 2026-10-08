import { fireEvent, render, screen } from "@testing-library/react";
import { GamesTrendChart } from "@/presentation/components/displays/GamesTrendChart/GamesTrendChartComponent";
import {
	buildGeometry,
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
	benchmark: 45,
	benchmarkLabel: "Prior avg 45 games/wk",
	benchmarkHint: "Average weekly games in the 4 weeks before the last 4",
	rangeLabel: "46 to 41 per week",
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
	it("maps the highest value to the top and the lowest to the bottom of the plot", () => {
		const geometry = buildGeometry([10, 20], null);

		expect(geometry.points).toEqual([
			{ x: 94, y: 65.5 },
			{ x: 282, y: 22 },
		]);
		expect(geometry.benchmarkY).toBeNull();
		expect(geometry.areaPath).toMatch(/Z$/);
	});

	it("keeps the benchmark inside the plot and centers a flat line", () => {
		expect(buildGeometry([40, 42], 50).benchmarkY).toBe(22);
		expect(buildGeometry([5, 5], null).points.map((item) => item.y)).toEqual([43.75, 43.75]);
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
	it("shows the period total, its change and the weekly line with the latest week selected", () => {
		render(<GamesTrendChart view={VIEW} />);

		expect(screen.getByText("172")).toBeInTheDocument();
		expect(screen.getByText("−3%")).toHaveClass("bg-[#fee2e2]");
		expect(screen.getByText("vs 178 in the previous 28 days")).toBeInTheDocument();
		expect(screen.getByText("Prior avg 45 games/wk")).toHaveAttribute(
			"title",
			"Average weekly games in the 4 weeks before the last 4",
		);
		expect(screen.getByText("46 to 41 per week")).toHaveClass("text-[#b91c1c]");
		expect(screen.getByTestId("games-trend-benchmark")).toBeInTheDocument();
		expect(screen.getByTestId("games-trend-tooltip")).toHaveTextContent("41games · Sep 30");
		expect(screen.getByText("Sep 30")).toHaveClass("text-[rgba(60,60,67,0.6)]");
		expect(screen.getByText("Aug 12")).toHaveClass("text-[rgba(60,60,67,0.3)]");
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

	it("leaves out the benchmark, range and change when they are unknown", () => {
		render(
			<GamesTrendChart
				view={{
					...VIEW,
					change: null,
					direction: "flat",
					benchmark: null,
					benchmarkLabel: null,
					rangeLabel: null,
				}}
			/>,
		);

		expect(screen.queryByTestId("games-trend-benchmark")).not.toBeInTheDocument();
		expect(screen.queryByText("−3%")).not.toBeInTheDocument();
		expect(screen.queryByText("46 to 41 per week")).not.toBeInTheDocument();
	});
});
