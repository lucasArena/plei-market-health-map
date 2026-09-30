import { render, screen } from "@testing-library/react";
import { WeeklyActivityChart } from "@/presentation/components/displays/WeeklyActivityChart/WeeklyActivityChartComponent";

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

	it("draws a second series on the same chart with its own legend", () => {
		const point = (value: number, tooltip: string) => ({
			key: "2026-09-28",
			label: "Sep 28",
			shortLabel: "Sep 28",
			value,
			valueLabel: `${value}`,
			tooltip,
		});
		render(
			<WeeklyActivityChart
				title="Weekly usage"
				legend="All users"
				points={[point(6, "All users: 6")]}
				secondary={{ legend: "Target users", points: [point(3, "Target users: 3")] }}
			/>,
		);
		expect(screen.getByText("All users")).toBeInTheDocument();
		expect(screen.getByText("Target users")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "All users: 6" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Target users: 3" })).toBeInTheDocument();
	});
});
