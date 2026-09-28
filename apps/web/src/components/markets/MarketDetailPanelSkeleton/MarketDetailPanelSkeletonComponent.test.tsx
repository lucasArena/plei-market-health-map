import { render, screen } from "@testing-library/react";
import { MarketDetailPanelSkeleton } from "@/components/markets/MarketDetailPanelSkeleton/MarketDetailPanelSkeletonComponent";

describe("MarketDetailPanelSkeleton", () => {
	it("renders indicator and facility placeholders", () => {
		render(<MarketDetailPanelSkeleton />);

		const skeleton = screen.getByTestId("market-detail-skeleton");
		expect(skeleton).toHaveAttribute("aria-hidden");
		expect(skeleton.querySelectorAll(".rounded-full")).toHaveLength(7);
	});
});
