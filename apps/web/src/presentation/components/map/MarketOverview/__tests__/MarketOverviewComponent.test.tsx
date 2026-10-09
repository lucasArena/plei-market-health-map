import { fireEvent, render, screen } from "@testing-library/react";
import { MarketOverview } from "@/presentation/components/map/MarketOverview/MarketOverviewComponent";

const mockRules = vi.fn();
const showAllMarkets = vi.fn();

vi.mock("@/presentation/components/map/FacilitiesTable/FacilitiesTableComponent", () => ({
	FacilitiesTable: ({ marketName }: { marketName: string }) => (
		<div data-testid="facilities-table">{marketName}</div>
	),
}));

vi.mock("@/presentation/components/map/MarketOverview/MarketOverviewComponent.rules", () => ({
	useMarketOverviewRules: () => mockRules(),
}));

const HEADER = {
	breadcrumb: [
		{ key: "all", label: "All markets", onSelect: showAllMarkets },
		{ key: "miami", label: "Miami Metro" },
	],
	breadcrumbLabel: "Location",
	title: "Miami Metro",
	level: "Market",
	comparison: { current: "Sep 9 – Oct 6, 2026", previous: "vs Aug 12 – Sep 8" },
	subtitle: null,
	footnote: "11 of 14 facilities active",
};

const CARD = { label: "Games played", info: "Played games.", value: "48", change: null };

const SECTIONS = {
	status: {
		tone: "attention",
		label: "Needs attention",
		headline: "Miami Metro: down 3 weeks in a row, driven by 2 facilities.",
		detail: "11 of the 12 games lost (60 → 48) came from Pegaso and Doral.",
	},
	scorecards: {
		played: { ...CARD, aside: "Main metric", caption: "vs 60 in the previous 28 days" },
		confirmation: { ...CARD, label: "Confirmation rate", value: "75%" },
		cancellation: { ...CARD, label: "Cancellation rate", value: "11%" },
	},
	trend: {
		total: "48",
		change: null,
		comparison: "vs 60 in the previous 28 days",
		direction: "down",
		axisMax: null,
		axisLabel: null,
		points: [],
		metrics: [],
	},
};

describe("MarketOverview", () => {
	beforeEach(() => vi.clearAllMocks());

	it("shows the market header, its status, the scorecards and the weekly trend", () => {
		mockRules.mockReturnValue({
			facilities: [],
			header: HEADER,
			scorecardsTitle: "Scorecards",
			sections: SECTIONS,
			trendAside: "Weekly, last 8 weeks",
			trendTitle: "Games trend",
		});

		render(<MarketOverview marketId="miami" marketName="Miami Metro" />);

		expect(screen.getByRole("heading", { name: "Miami Metro" })).toBeInTheDocument();
		expect(screen.getByTestId("market-overview-dates")).toHaveTextContent(
			"Sep 9 – Oct 6, 2026vs Aug 12 – Sep 8",
		);
		expect(screen.getByText("11 of 14 facilities active")).toBeInTheDocument();
		expect(screen.getByTestId("status-summary")).toHaveTextContent("Needs attention");
		expect(screen.getByRole("region", { name: "Scorecards" })).toContainElement(
			screen.getByTestId("score-played"),
		);
		expect(screen.getByTestId("score-confirmation")).toHaveTextContent("75%");
		expect(screen.getByTestId("score-cancellation")).toHaveTextContent("11%");
		expect(screen.getByRole("region", { name: "Games trend" })).toContainElement(
			screen.getByTestId("market-games-trend"),
		);

		expect(screen.getByTestId("facilities-table")).toHaveTextContent("Miami Metro");
		fireEvent.click(screen.getByRole("button", { name: "All markets" }));
		expect(showAllMarkets).toHaveBeenCalledOnce();
		expect(screen.queryByRole("button", { name: "7D" })).not.toBeInTheDocument();
	});

	it("shows only the header until the summary loads", () => {
		mockRules.mockReturnValue({
			header: { ...HEADER, footnote: null },
			scorecardsTitle: "Scorecards",
			sections: null,
		});

		render(<MarketOverview marketId="miami" marketName="Miami Metro" />);

		expect(screen.queryByTestId("status-summary")).not.toBeInTheDocument();
		expect(screen.queryByText("11 of 14 facilities active")).not.toBeInTheDocument();
	});

	it("holds the facilities card as a skeleton until the facilities load", () => {
		mockRules.mockReturnValue({
			facilities: undefined,
			header: HEADER,
			scorecardsTitle: "Scorecards",
			sections: SECTIONS,
			trendAside: "Weekly, last 8 weeks",
			trendTitle: "Games trend",
		});

		render(<MarketOverview marketId="miami" marketName="Miami Metro" />);

		expect(screen.getByTestId("facilities-table-skeleton")).toBeInTheDocument();
		expect(screen.queryByTestId("facilities-table")).not.toBeInTheDocument();
	});
});
