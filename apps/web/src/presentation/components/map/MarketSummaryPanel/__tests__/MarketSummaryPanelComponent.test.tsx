import { fireEvent, render, screen } from "@testing-library/react";
import { EN_MESSAGES } from "@/application/test/messages";
import { MarketSummaryPanel } from "@/presentation/components/map/MarketSummaryPanel/MarketSummaryPanelComponent";

const mockRules = vi.fn();

vi.mock("@/presentation/components/displays/AiSummary/AiSummaryComponent", () => ({
	AiSummary: ({ fallback }: { fallback: string }) => <p>{fallback}</p>,
}));
vi.mock(
	"@/presentation/components/map/MarketSummaryPanel/MarketSummaryPanelComponent.rules",
	() => ({
		useMarketSummaryPanelRules: () => mockRules(),
	}),
);

const VIEW = {
	summary: "212 games across 84 active facilities.",
	scopeTiles: [
		{
			key: "facilities",
			label: "Active facilities",
			value: "84",
			hint: "of 142",
			hintDirection: "flat",
			isLoading: false,
		},
	],
	tiles: [
		{
			key: "players",
			label: "Unique players",
			value: "",
			hint: null,
			hintDirection: "flat",
			isLoading: true,
		},
	],
	weeklyActivity: [
		{
			key: "2026-09-21",
			label: "Sep 21",
			shortLabel: "Sep 21",
			value: 12,
			valueLabel: "12 games",
			tooltip: "Sep 21: 12 games",
		},
	],
	popularTimes: [
		{
			key: "1-0",
			dayLabel: "Mon",
			periodLabel: "AM",
			value: 2,
			tooltip: "Mon, AM: 2 games",
			intensity: 4,
		},
	],
	dayLabels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
	timePeriodLabels: ["AM", "Midday", "PM", "Late"],
	topMarkets: [
		{ key: "houston", rank: 1, name: "Houston", detail: "6 of 9 facilities active", value: "120" },
	],
	topFacilities: [],
	lastPlayedLabel: "Last game played Sep 27, 2026",
};

function rulesWith(overrides: object = {}) {
	return {
		aiContext: { cacheKey: "v4:all-markets-all:2026-09-21:en", prompt: [] },
		detailMessages: EN_MESSAGES.facilityDetail,
		handleAnimationEnd: vi.fn(),
		heading: { title: "All markets", subtitle: EN_MESSAGES.marketSummary.subtitle },
		isClosing: false,
		isSummaryPending: false,
		messages: EN_MESSAGES.marketSummary,
		onClose: vi.fn(),
		status: "ready",
		view: VIEW,
		...overrides,
	};
}

const PROPS = { isClosing: false, onClose: vi.fn(), onClosed: vi.fn() };

describe("MarketSummaryPanel", () => {
	it("renders the market-wide report", () => {
		mockRules.mockReturnValue(rulesWith());

		render(<MarketSummaryPanel {...PROPS} />);

		expect(screen.getByRole("complementary", { name: "Market summary" })).toHaveClass(
			"panel-slide-in",
		);
		expect(screen.getByRole("heading", { name: "All markets" })).toBeInTheDocument();
		expect(screen.getByText(VIEW.summary)).toBeInTheDocument();
		expect(screen.getByText("of 142")).toBeInTheDocument();
		expect(screen.getByTestId("market-stat-players-skeleton")).toBeInTheDocument();
		expect(screen.getByRole("heading", { name: "Weekly activity" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Mon, AM: 2 games" })).toBeInTheDocument();
		expect(screen.getByRole("heading", { name: "Top markets" })).toBeInTheDocument();
		expect(screen.getByText("6 of 9 facilities active")).toBeInTheDocument();
		expect(screen.getByText(EN_MESSAGES.marketSummary.noRankings)).toBeInTheDocument();
		expect(screen.getByText(VIEW.lastPlayedLabel)).toBeInTheDocument();
	});

	it("hides the scope tiles and rankings a single facility does not need", () => {
		mockRules.mockReturnValue(
			rulesWith({
				heading: { title: "Pegaso HTX", subtitle: "Facility in Houston, last 28 days" },
				view: { ...VIEW, scopeTiles: [], topMarkets: null, topFacilities: null },
			}),
		);

		render(<MarketSummaryPanel {...PROPS} />);

		expect(screen.getByRole("heading", { name: "Pegaso HTX" })).toBeInTheDocument();
		expect(screen.getByText("Facility in Houston, last 28 days")).toBeInTheDocument();
		expect(screen.queryByText("of 142")).not.toBeInTheDocument();
		expect(screen.queryByRole("heading", { name: "Top markets" })).not.toBeInTheDocument();
		expect(screen.queryByRole("heading", { name: "Top facilities" })).not.toBeInTheDocument();
	});

	it("shows a sentence skeleton while player analytics load", () => {
		mockRules.mockReturnValue(
			rulesWith({ isSummaryPending: true, view: { ...VIEW, summary: null } }),
		);

		render(<MarketSummaryPanel {...PROPS} />);

		expect(screen.getByTestId("market-summary-text-skeleton")).toBeInTheDocument();
	});

	it("closes from the button and reports the end of the animation", () => {
		const rules = rulesWith({ isClosing: true });
		mockRules.mockReturnValue(rules);

		render(<MarketSummaryPanel {...PROPS} isClosing />);
		fireEvent.click(screen.getByRole("button", { name: "Close market summary" }));
		const panel = screen.getByRole("complementary");
		fireEvent(panel, new Event("webkitAnimationEnd", { bubbles: true }));

		expect(panel).toHaveClass(
			"panel-slide-out",
			"map-glass",
			"top-[calc(var(--map-frame)+32px+8px)]",
			"right-[var(--map-frame)]",
			"shadow-[var(--map-shadow)]",
		);
		expect(rules.onClose).toHaveBeenCalled();
		expect(rules.handleAnimationEnd).toHaveBeenCalled();
	});

	it("shows a skeleton while loading and an error when the request fails", () => {
		mockRules.mockReturnValue(rulesWith({ status: "loading", view: null }));
		const { unmount } = render(<MarketSummaryPanel {...PROPS} />);
		expect(screen.getByTestId("market-summary-skeleton")).toBeInTheDocument();
		unmount();

		mockRules.mockReturnValue(rulesWith({ status: "error", view: null }));
		render(<MarketSummaryPanel {...PROPS} />);
		expect(screen.getByRole("alert")).toHaveTextContent("Could not load the market summary.");
	});
});
