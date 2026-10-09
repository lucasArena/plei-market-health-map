import { render, screen } from "@testing-library/react";
import { WeeklyBars } from "@/presentation/components/displays/WeeklyBars/WeeklyBarsComponent";
import { barHeight } from "@/presentation/components/displays/WeeklyBars/WeeklyBarsComponent.rules";
import type { WeeklyBarTone } from "@/presentation/components/displays/WeeklyBars/WeeklyBarsComponent.types";

const TONES: WeeklyBarTone[] = ["previous", "previous", "flat", "down1", "down2", "down3"];

const POINTS = [16, 15, 15, 13, 11, 10].map((value, index) => ({
	key: `w${index}`,
	value,
	valueLabel: String(value),
	weekLabel: `W${index}`,
	ariaLabel: `${value} games, week of W${index}`,
	tone: TONES[index] ?? "previous",
	isLatest: index === 5,
}));

describe("WeeklyBars", () => {
	it("scales bars to the highest week and keeps empty weeks visible", () => {
		expect(barHeight(16, [16, 8])).toBe(64);
		expect(barHeight(8, [16, 8])).toBe(32);
		expect(barHeight(0, [16, 0])).toBe(2);
		expect(barHeight(0, [0, 0])).toBe(2);
	});

	it("draws each week with its tone, the streak caption and the period groups", () => {
		render(
			<WeeklyBars
				testId="games-trend"
				title="Games trend"
				aside="Weekly, last 8 weeks"
				caption={{ direction: "down", label: "Down 3 weeks in a row", sequence: "13 → 11 → 10" }}
				points={POINTS}
				groups={[
					{ key: "previous", label: "Previous 28 days · 60", weeks: 2, isCurrent: false },
					{ key: "current", label: "This period · 48", weeks: 4, isCurrent: true },
				]}
			/>,
		);

		expect(screen.getByRole("region", { name: "Games trend" })).toBeInTheDocument();
		expect(screen.getByTestId("games-trend-caption")).toHaveTextContent(
			"Down 3 weeks in a row· 13 → 11 → 10",
		);
		const bars = screen.getAllByRole("listitem");
		expect(bars).toHaveLength(6);
		expect(screen.getByRole("listitem", { name: "10 games, week of W5" })).toBeInTheDocument();
		expect(bars[5]?.querySelector("[data-tone]")).toHaveClass("bg-[#dc2626]");
		expect(screen.getByText("This period · 48")).toHaveStyle({ flexGrow: "4" });
	});

	it("leaves out the caption and groups when not given", () => {
		render(
			<WeeklyBars testId="t" title="T" aside="A" caption={null} points={POINTS} groups={[]} />,
		);

		expect(screen.queryByTestId("t-caption")).not.toBeInTheDocument();
		expect(screen.queryByText(/This period/)).not.toBeInTheDocument();
	});
});
