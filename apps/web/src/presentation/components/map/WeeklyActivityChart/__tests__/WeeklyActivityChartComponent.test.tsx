import { render, screen } from "@testing-library/react";
import { WeeklyActivityChart } from "@/presentation/components/map/WeeklyActivityChart/WeeklyActivityChartComponent";

describe("WeeklyActivityChart", () => {
	it("renders interactive points with accessible tooltip content", () => {
		render(
			<WeeklyActivityChart
				title="Weekly activity"
				legend="Games"
				points={[
					{
						key: "2026-09-21",
						label: "Sep 21",
						shortLabel: "Sep 21",
						value: 11,
						valueLabel: "11 games",
						tooltip: "Sep 21: 11 games",
					},
				]}
			/>,
		);
		expect(screen.getByRole("heading", { name: "Weekly activity" })).toBeInTheDocument();
		expect(screen.getByText("Games")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Sep 21: 11 games" })).toBeInTheDocument();
		expect(screen.getByRole("tooltip")).toHaveTextContent("Sep 21: 11 games");
	});
});
