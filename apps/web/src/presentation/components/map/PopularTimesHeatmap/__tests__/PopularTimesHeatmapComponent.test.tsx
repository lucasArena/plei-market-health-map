import { render, screen } from "@testing-library/react";
import { PopularTimesHeatmap } from "@/presentation/components/map/PopularTimesHeatmap/PopularTimesHeatmapComponent";

function renderHeatmap(periodRanges: string[], hasGlassTooltips = false) {
	render(
		<PopularTimesHeatmap
			title="Popular times"
			dayLabels={["Mon"]}
			periodLabels={["Morning"]}
			periodRanges={periodRanges}
			cells={[
				{
					key: "1-0",
					dayLabel: "Mon",
					periodLabel: "Morning",
					value: 3,
					label: "Mon, Morning: 3 games",
					tooltip: "3 games",
					intensity: 4,
				},
			]}
			quietLabel="Quiet"
			busyLabel="Busy"
			hasGlassTooltips={hasGlassTooltips}
		/>,
	);
}

describe("PopularTimesHeatmap", () => {
	it("renders interactive cells and the intensity legend", () => {
		renderHeatmap(["7am–12pm"]);
		expect(screen.getByRole("heading", { name: "Popular times" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Mon, Morning: 3 games" })).toHaveClass(
			"bg-pleiful-pitch-green-50",
		);
		expect(screen.getByText("3 games")).toHaveAttribute("role", "tooltip");
		expect(screen.getByText("Quiet")).toBeInTheDocument();
		expect(screen.getByText("Busy")).toBeInTheDocument();
	});

	it("explains each period label with its time range", () => {
		renderHeatmap(["7am–12pm"]);
		const label = screen.getByRole("button", { name: "Morning" });
		expect(label).toHaveClass("cursor-help");
		expect(label).toHaveAccessibleDescription("7am–12pm");
	});

	it("keeps the period label when no range is provided", () => {
		renderHeatmap([]);
		expect(screen.getByRole("button", { name: "Morning" })).toBeInTheDocument();
	});

	it("uses the glass tooltip surface in the insight panel", () => {
		renderHeatmap(["7am–12pm"], true);
		expect(screen.getByText("3 games")).toHaveClass("map-glass", "text-foreground");
	});
});
