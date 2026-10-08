import { fireEvent, render, screen } from "@testing-library/react";
import { EN_MESSAGES } from "@/application/test/messages";
import { MarketSummaryPanel } from "@/presentation/components/map/MarketSummaryPanel/MarketSummaryPanelComponent";

const mockRules = vi.fn();

vi.mock("@/presentation/components/displays/AiSummarySkeleton/AiSummarySkeletonComponent", () => ({
	AiSummarySkeleton: ({ testId }: { testId: string }) => (
		<div data-testid={testId} aria-busy="true" />
	),
}));

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
			periodLabel: "Morning",
			value: 2,
			label: "Mon, Morning: 2 games",
			tooltip: "2 games",
			intensity: 4,
		},
	],
	dayLabels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
	timePeriodLabels: ["Morning", "Afternoon", "Evening", "Late night"],
	topMarkets: [
		{ key: "houston", rank: 1, name: "Houston", detail: "6 of 9 facilities active", value: "120" },
	],
	topFacilities: [],
	lastPlayedLabel: "Last game played Sep 27, 2026",
};

function rulesWith(overrides: object = {}) {
	return {
		aiContext: { cacheKey: "v4:all-markets-all:2026-09-21:en", prompt: [] },
		comparison: { current: "Sep 9 – Oct 6, 2026", previous: "vs Aug 12 – Sep 8" },
		dataAsOf: "Data as of Oct 7, 2026, 9:35 PM",
		isRedesigned: false,
		reportWrongNumber: vi.fn(),
		insight: { title: "Key insights", tone: "neutral" },
		gamesTrend: null,
		gamesTitle: "Games the last 7 days",
		userTiles: VIEW.tiles,
		scopeLine: "42 of 58 facilities active · 8 of 12 markets active",
		detailMessages: EN_MESSAGES.facilityDetail,
		handleAnimationEnd: vi.fn(),
		heading: { title: "All markets", subtitle: EN_MESSAGES.marketSummary.subtitle },
		isClosing: false,
		isSummaryPending: false,
		messages: EN_MESSAGES.marketSummary,
		onClose: vi.fn(),
		rankingsEmptyLabel: "No games played last week.",
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
		expect(screen.getByRole("button", { name: "Mon, Morning: 2 games" })).toBeInTheDocument();
		expect(screen.getByRole("heading", { name: "Top markets" })).toBeInTheDocument();
		expect(screen.getByText("6 of 9 facilities active")).toBeInTheDocument();
		expect(screen.getByText("No games played last week.")).toBeInTheDocument();
		expect(screen.getByText(VIEW.lastPlayedLabel)).toBeInTheDocument();
	});

	it("keeps the current header and footer while the redesign is off", () => {
		mockRules.mockReturnValue(rulesWith());

		render(<MarketSummaryPanel {...PROPS} />);

		expect(screen.queryByTestId("market-summary-dates")).not.toBeInTheDocument();
		expect(screen.queryByTestId("health-strip")).not.toBeInTheDocument();
		expect(screen.queryByText("Data as of Oct 7, 2026, 9:35 PM")).not.toBeInTheDocument();
		expect(screen.queryByRole("button", { name: "Report a wrong number" })).not.toBeInTheDocument();
	});

	it("shows the redesigned header, health strip and data freshness footer", () => {
		const reportWrongNumber = vi.fn();
		mockRules.mockReturnValue(rulesWith({ isRedesigned: true, reportWrongNumber }));

		render(<MarketSummaryPanel {...PROPS} />);

		expect(
			screen.getByText("42 of 58 facilities active · 8 of 12 markets active"),
		).toBeInTheDocument();
		expect(screen.getByTestId("market-summary-dates")).toHaveTextContent(
			"Sep 9 – Oct 6, 2026vs Aug 12 – Sep 8",
		);
		expect(screen.getByText(VIEW.summary)).toBeInTheDocument();
		expect(screen.queryByText("of 142")).not.toBeInTheDocument();
		expect(screen.getByRole("region", { name: "Games the last 7 days" })).toContainElement(
			screen.getByRole("heading", { name: "Weekly activity" }),
		);
		expect(screen.getByRole("region", { name: "Users" })).toContainElement(
			screen.getByTestId("market-stat-players-skeleton"),
		);
		expect(screen.queryByRole("region", { name: "Markets" })).not.toBeInTheDocument();
		expect(screen.queryByRole("region", { name: "Facilities" })).not.toBeInTheDocument();
		expect(screen.queryByRole("heading", { name: "Top markets" })).not.toBeInTheDocument();
		expect(
			screen.queryByRole("heading", { name: "Popular times · last 28 days" }),
		).not.toBeInTheDocument();
		expect(screen.getByText("Data as of Oct 7, 2026, 9:35 PM")).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: "Report a wrong number" }));
		expect(reportWrongNumber).toHaveBeenCalledOnce();
	});

	it("tints the written insight with the overall trend", () => {
		mockRules.mockReturnValue(
			rulesWith({
				aiContext: null,
				isRedesigned: true,
				insight: { title: "Needs attention · Key insights", tone: "attention" },
			}),
		);

		render(<MarketSummaryPanel {...PROPS} />);

		expect(screen.getByTestId("health-strip")).toHaveAttribute("data-tone", "attention");
		expect(
			screen.getByRole("heading", { name: "Needs attention · Key insights" }),
		).toBeInTheDocument();
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

	it("shows the AI skeleton, not the template, while player analytics load even when insights are ready", () => {
		mockRules.mockReturnValue(rulesWith({ isSummaryPending: true, aiContext: null }));

		render(<MarketSummaryPanel {...PROPS} />);

		expect(screen.getByTestId("market-summary-text-skeleton")).toBeInTheDocument();
		expect(screen.queryByRole("heading", { name: "Key insights" })).not.toBeInTheDocument();
	});

	it("falls back to the written insights once player analytics are done without AI", () => {
		mockRules.mockReturnValue(rulesWith({ isSummaryPending: false, aiContext: null }));

		render(<MarketSummaryPanel {...PROPS} />);

		expect(screen.queryByTestId("market-summary-text-skeleton")).not.toBeInTheDocument();
		expect(screen.getByRole("heading", { name: "Key insights" })).toBeInTheDocument();
	});

	it("shows a sentence skeleton while player analytics load", () => {
		mockRules.mockReturnValue(
			rulesWith({ isSummaryPending: true, view: { ...VIEW, summary: null } }),
		);

		render(<MarketSummaryPanel {...PROPS} />);

		expect(screen.getByTestId("market-summary-text-skeleton")).toBeInTheDocument();
	});

	it("omits a close button and reports the end of the closing animation", () => {
		const rules = rulesWith({ isClosing: true });
		mockRules.mockReturnValue(rules);

		render(<MarketSummaryPanel {...PROPS} isClosing />);
		expect(screen.queryByRole("button", { name: "Close market summary" })).not.toBeInTheDocument();
		const panel = screen.getByRole("complementary");
		fireEvent(panel, new Event("webkitAnimationEnd", { bubbles: true }));

		expect(panel).toHaveClass(
			"panel-slide-out",
			"map-glass",
			"top-[calc(var(--map-frame)+32px+8px)]",
			"right-[var(--map-frame)]",
			"shadow-[var(--map-shadow)]",
		);
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
