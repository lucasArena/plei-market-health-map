import { render, screen } from "@testing-library/react";
import { MarketOverviewSkeleton } from "@/presentation/components/map/MarketOverviewSkeleton/MarketOverviewSkeletonComponent";

describe("MarketOverviewSkeleton", () => {
	it("mirrors the market view: header, status, scorecards, trend and facilities", () => {
		render(<MarketOverviewSkeleton />);

		expect(screen.getByTestId("market-overview-skeleton")).toHaveAttribute("aria-hidden", "true");
		expect(screen.getByTestId("market-trend-skeleton")).toBeInTheDocument();
		expect(screen.getByTestId("facilities-table-skeleton")).toBeInTheDocument();
	});
});
