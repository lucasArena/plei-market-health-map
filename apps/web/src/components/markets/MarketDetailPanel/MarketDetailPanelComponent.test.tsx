import { fireEvent, render, screen } from "@testing-library/react";
import { MarketDetailPanel } from "@/components/markets/MarketDetailPanel/MarketDetailPanelComponent";
import { EN_MESSAGES } from "@/test/messages";

const mockRules = vi.fn();

vi.mock("@/components/markets/MarketDetailPanel/MarketDetailPanelComponent.rules", () => ({
	useMarketDetailPanelRules: () => mockRules(),
}));

const onClose = vi.fn();

const VIEW = {
	header: {
		title: "Tampa",
		subtitle: "Florida · USA",
		statusLabel: "At risk",
		statusColor: "#dc2626",
		healthStatus: "at-risk",
	},
	indicators: [
		{ key: "healthScore", label: "Health score", value: "37", suffix: "/100" },
		{ key: "activePlayers", label: "Active players", value: "1,300" },
	],
	facilities: [
		{
			id: "f1",
			marketId: "sample-tampa",
			name: "Harbor Sports Dome",
			address: "120 Main St, Tampa, FL",
			avatarUrl: null,
			metrics: { activePlayers: 1200, gamesLastWeek: 90, utilization: 81 },
			playersLabel: "1,200 players",
			gamesLabel: "90 games/wk",
			utilizationLabel: "81% utilization",
		},
	],
	facilitiesCountLabel: "1 facilities",
};

function rulesWith(status: string, view: unknown) {
	return { messages: EN_MESSAGES.marketDetail, onClose, status, view };
}

describe("MarketDetailPanel", () => {
	beforeEach(() => vi.clearAllMocks());

	it("shows the skeleton while loading", () => {
		mockRules.mockReturnValue(rulesWith("loading", null));

		render(<MarketDetailPanel marketId="sample-tampa" onClose={onClose} />);

		expect(screen.getByTestId("market-detail-skeleton")).toBeInTheDocument();
		expect(screen.getByRole("complementary")).toHaveAttribute("aria-busy", "true");
	});

	it("shows indicators on top and facilities below", () => {
		mockRules.mockReturnValue(rulesWith("ready", VIEW));

		render(<MarketDetailPanel marketId="sample-tampa" onClose={onClose} />);

		expect(screen.getByRole("heading", { name: "Tampa" })).toBeInTheDocument();
		expect(screen.getByText("Florida · USA")).toBeInTheDocument();
		expect(screen.getByText("At risk")).toBeInTheDocument();
		expect(screen.getByText("Health score")).toBeInTheDocument();
		expect(screen.getByText("/100")).toBeInTheDocument();
		expect(screen.getByText("Harbor Sports Dome")).toBeInTheDocument();
		expect(screen.getByText("HS")).toBeInTheDocument();
		expect(screen.getByText("90 games/wk")).toBeInTheDocument();
		expect(screen.getByText("1 facilities")).toBeInTheDocument();
	});

	it("shows an empty message when there are no facilities", () => {
		mockRules.mockReturnValue(rulesWith("ready", { ...VIEW, facilities: [] }));

		render(<MarketDetailPanel marketId="sample-tampa" onClose={onClose} />);

		expect(screen.getByText(EN_MESSAGES.marketDetail.empty)).toBeInTheDocument();
	});

	it("shows an error", () => {
		mockRules.mockReturnValue(rulesWith("error", null));

		render(<MarketDetailPanel marketId="sample-tampa" onClose={onClose} />);

		expect(screen.getByRole("alert")).toHaveTextContent(EN_MESSAGES.marketDetail.failed);
		expect(screen.getByRole("complementary", { name: "Facilities" })).toBeInTheDocument();
	});

	it("closes from the close button", () => {
		mockRules.mockReturnValue(rulesWith("ready", VIEW));

		render(<MarketDetailPanel marketId="sample-tampa" onClose={onClose} />);
		fireEvent.click(screen.getByRole("button", { name: EN_MESSAGES.marketDetail.close }));

		expect(onClose).toHaveBeenCalled();
	});
});
