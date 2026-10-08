import { render, screen } from "@testing-library/react";
import { TrendChartSkeleton } from "@/presentation/components/displays/TrendChartSkeleton/TrendChartSkeletonComponent";

describe("TrendChartSkeleton", () => {
	it("mirrors the chart with eight weeks, the requested metric rows and an optional label", () => {
		const { container } = render(
			<TrendChartSkeleton testId="games-skeleton" metricRows={3} hasLabel />,
		);

		const skeleton = screen.getByTestId("games-skeleton");
		expect(skeleton).toHaveAttribute("aria-hidden", "true");
		expect(skeleton).toHaveClass("animate-pulse");
		expect(container.querySelectorAll("line")).toHaveLength(2);
		expect(container.querySelectorAll(".h-px")).toHaveLength(3);
		expect(container.querySelectorAll(".w-24")).toHaveLength(4);
	});

	it("leaves out the label and rows when not asked for", () => {
		const { container } = render(<TrendChartSkeleton testId="bare" metricRows={0} />);

		expect(container.querySelectorAll(".h-px")).toHaveLength(0);
		expect(container.querySelectorAll(".w-24")).toHaveLength(0);
	});
});
