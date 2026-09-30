import { render, screen } from "@testing-library/react";
import { PopularTimesHeatmap } from "@/presentation/components/map/PopularTimesHeatmap/PopularTimesHeatmapComponent";

describe("PopularTimesHeatmap", () => {
	it("renders interactive cells and the intensity legend", () => {
		render(
			<PopularTimesHeatmap
				title="Popular times"
				dayLabels={["Mon"]}
				periodLabels={["AM"]}
				cells={[
					{
						key: "1-0",
						dayLabel: "Mon",
						periodLabel: "AM",
						value: 3,
						tooltip: "Mon, AM: 3 games",
						intensity: 4,
					},
				]}
				quietLabel="Quiet"
				busyLabel="Busy"
			/>,
		);
		expect(screen.getByRole("heading", { name: "Popular times" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Mon, AM: 3 games" })).toHaveClass(
			"bg-pleiful-pitch-green-50",
		);
		expect(screen.getByRole("tooltip")).toHaveTextContent("Mon, AM: 3 games");
		expect(screen.getByText("Quiet")).toBeInTheDocument();
		expect(screen.getByText("Busy")).toBeInTheDocument();
	});
});
