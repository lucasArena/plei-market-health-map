import { screen } from "@testing-library/react";
import { renderWithMessages } from "@/application/test/render-with-messages";
import { InsightPanelSkeleton } from "@/presentation/components/map/InsightPanelSkeleton/InsightPanelSkeletonComponent";

describe("InsightPanelSkeleton", () => {
	it("mirrors All markets: insight, games, users, markets and facilities", () => {
		renderWithMessages(<InsightPanelSkeleton level="all" />);

		const skeleton = screen.getByTestId("market-summary-skeleton");
		expect(skeleton).toHaveAttribute("aria-hidden", "true");
		expect(skeleton).toHaveAttribute("data-level", "all");
		expect(screen.getByTestId("insight-skeleton")).toBeInTheDocument();
		expect(screen.getByTestId("games-skeleton").querySelectorAll("li")).toHaveLength(3);
		expect(screen.getByTestId("users-skeleton").querySelectorAll("li")).toHaveLength(3);
		expect(screen.getByTestId("markets-skeleton").querySelectorAll("li")).toHaveLength(5);
		expect(screen.getByTestId("facilities-skeleton")).toBeInTheDocument();
		expect(screen.queryByTestId("facility-profile-skeleton")).not.toBeInTheDocument();
	});

	it("leaves the markets list out for a market", () => {
		renderWithMessages(<InsightPanelSkeleton level="market" />);

		expect(screen.queryByTestId("markets-skeleton")).not.toBeInTheDocument();
		expect(screen.getByTestId("facilities-skeleton")).toBeInTheDocument();
	});

	it("shows the facility's address, one users row and popular times instead of lists", () => {
		renderWithMessages(<InsightPanelSkeleton level="facility" />);

		expect(screen.getByTestId("facility-profile-skeleton")).toBeInTheDocument();
		expect(screen.getByTestId("users-skeleton").querySelectorAll("li")).toHaveLength(1);
		expect(screen.getByTestId("popular-times-skeleton")).toBeInTheDocument();
		expect(screen.queryByTestId("facilities-skeleton")).not.toBeInTheDocument();
	});
});
