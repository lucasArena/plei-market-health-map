import { fireEvent, render, screen, within } from "@testing-library/react";
import { EN_MESSAGES } from "@/application/test/messages";
import { MODULE_ROW_DIVIDER_CLASS } from "@/presentation/components/displays/StatTiles/StatTilesComponent.styles";
import { InsightPanel } from "@/presentation/components/map/InsightPanel/InsightPanelComponent";
import {
	PANEL_DESCRIPTION_CLASS,
	PANEL_TITLE_CLASS,
} from "@/presentation/components/map/InsightPanel/InsightPanelComponent.styles";

const mockRules = vi.fn();

vi.mock("@/presentation/components/displays/AiSummarySkeleton/AiSummarySkeletonComponent", () => ({
	AiSummarySkeleton: ({ testId }: { testId: string }) => (
		<div data-testid={testId} aria-busy="true" />
	),
}));

vi.mock("@/presentation/components/displays/AiSummary/AiSummaryComponent", () => ({
	AiSummary: ({ fallback }: { fallback: string }) => <p>{fallback}</p>,
}));
vi.mock("@/presentation/components/map/InsightPanel/InsightPanelComponent.rules", () => ({
	useInsightPanelRules: () => mockRules(),
}));

const VIEW = {
	summary: "212 games across 84 active facilities.",
	games: {
		title: "Games in the last 28 days",
		hero: {
			value: "212",
			comparison: "vs 200 in the previous 28 days",
			change: { direction: "up", tone: "better", label: "+6%", description: "Improved +6%" },
		},
		series: [
			{
				key: "2026-09-21",
				label: "Sep 21",
				value: 12,
				valueLabel: "12",
				tooltipDetail: "games · Sep 21",
			},
		],
		axisMax: 20,
		ticks: [
			{ value: 0, label: "0" },
			{ value: 20, label: "20" },
		],
		rows: [],
	},
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
	users: {
		title: "Active players",
		hero: {
			value: "126",
			comparison: "vs 100 in the previous 28 days",
			change: { direction: "up", tone: "better", label: "+26%", description: "Improved +26%" },
		},
		series: [],
		axisMax: 0,
		ticks: [],
		rows: [
			{
				key: "activated",
				label: "Activated players",
				value: "24",
				previousLabel: "vs 30",
				change: {
					direction: "down",
					tone: "worse",
					label: "\u221220%",
					description: "Worsened \u221220%",
				},
			},
		],
	},
	isUsersPending: false,
	marketsHero: { value: "8", comparison: "4 inactive", change: null },
	topMarkets: [
		{
			key: "houston",
			id: "houston",
			name: "Houston",
			status: null,
			statusLabel: null,
			detail: "6 of 9 active",
			games: 120,
			gamesLabel: "120",
			changePercent: null,
			changeDirection: null,
			changeLabel: "\u2014",
			ariaLabel: "Houston, 6 of 9 active, 120 games",
		},
	],
	facilitiesHero: {
		value: "84",
		comparison: "58 inactive",
		change: null,
	},
	topFacilities: [
		{
			key: "77",
			id: "77",
			marketName: "Miami Metro",
			rank: 1,
			name: "Pegaso Soccer Miami",
			detail: "Miami Metro",
			value: "12 games",
			games: 12,
			gamesLabel: "12",
			status: null,
			statusLabel: null,
			changePercent: null,
			changeDirection: null,
			changeLabel: "",
			ariaLabel: "Pegaso Soccer Miami, Miami Metro: 12 games",
		},
	],
	lastPlayedLabel: "Last game played Sep 27, 2026",
};

const ALL_CRUMB = { key: "all", label: "All markets", title: "All markets", target: null };

const FACILITY_CRUMBS = [
	{ key: "all", label: "All markets", title: "All markets", target: { kind: "all" } },
	{
		key: "market",
		label: "Miami Metro",
		title: "Market: Miami Metro",
		target: { kind: "market", id: "mia", name: "Miami Metro" },
	},
	{
		key: "facility",
		label: "Pegaso Soccer Miami",
		title: "Facility: Pegaso Soccer Miami",
		target: null,
	},
];

function rulesWith(overrides: object = {}) {
	return {
		bodyRef: { current: null },
		aiContext: { cacheKey: "v4:all-markets-all:2026-09-21:en", prompt: [] },
		detailMessages: EN_MESSAGES.facilityDetail,
		facilityView: null,
		handleAnimationEnd: vi.fn(),
		heading: {
			title: "All markets",
			subtitle: EN_MESSAGES.marketSummary.subtitle,
			crumbs: [ALL_CRUMB],
		},
		isClosing: false,
		isSummaryPending: false,
		messages: EN_MESSAGES.marketSummary,
		onClose: vi.fn(),
		seeAllMarketsLabel: "See all 1 markets",
		seeAllFacilitiesLabel: "See all 1 facilities",
		selectCrumb: vi.fn(),
		selectFacility: vi.fn(),
		selectMarket: vi.fn(),
		rankingsEmptyLabel: "No games played last week.",
		status: "ready",
		view: VIEW,
		...overrides,
	};
}

const PROPS = { isClosing: false, onClose: vi.fn(), onClosed: vi.fn() };

describe("InsightPanel", () => {
	it("renders the market-wide report", () => {
		mockRules.mockReturnValue(rulesWith());

		render(<InsightPanel {...PROPS} />);

		expect(screen.getByRole("complementary", { name: "Market summary" })).toHaveClass(
			"panel-slide-in",
		);
		expect(screen.getByRole("heading", { level: 2, name: "Insight panel" })).toBeInTheDocument();
		expect(screen.getByText(VIEW.summary)).toBeInTheDocument();
		// No Active tiles box any more; Active facilities is its own Games-style module.
		expect(screen.queryByText("84 active")).not.toBeInTheDocument();
		expect(screen.queryByRole("heading", { name: "Top facilities" })).not.toBeInTheDocument();
		const facilities = screen.getByRole("region", { name: "Active facilities" });
		expect(screen.getByRole("heading", { level: 3, name: "Active facilities" })).toHaveClass(
			"text-[11px]",
			"leading-[13px]",
		);
		expect(facilities).toHaveClass("rounded-[10px]", "bg-foreground/[0.03]", "p-[12px]");
		expect(screen.getByTestId("facilities-hero")).toHaveTextContent("84");
		expect(screen.getByTestId("facilities-hero-comparison")).toHaveTextContent("58 inactive");
		// Same module as Markets: sortable Facility/Games header, no Change column (no per-facility trend data).
		const facilityHeader = screen.getByTestId("facility-list-header");
		expect(facilityHeader).toHaveClass("font-bold");
		expect(facilityHeader).not.toHaveClass("border-b");
		expect(within(facilityHeader).getByRole("button", { name: /Facility/ })).toBeInTheDocument();
		expect(within(facilityHeader).getByRole("button", { name: /Games/ })).toBeInTheDocument();
		expect(facilityHeader).not.toHaveTextContent("Change");
		const row = screen.getByRole("button", {
			name: "Pegaso Soccer Miami, Miami Metro: 12 games",
		});
		expect(within(row).getByTestId("market-row-chevron")).toHaveClass("text-[#9ca3af]");
		expect(within(row).getByTestId("market-row-detail")).toHaveTextContent("Miami Metro");
		expect(row).toHaveClass(
			"hover:bg-foreground/[0.07]",
			"focus:bg-foreground/[0.07]",
			"rounded-[6px]",
			"focus-visible:outline-primary",
		);
		expect(row.parentElement).toHaveClass(...MODULE_ROW_DIVIDER_CLASS.split(" "));
		expect(row).toHaveClass("py-[calc(0.375rem+2px)]");
		expect(row.querySelector(".tabular-nums.text-right")).toHaveTextContent("12");
		expect(screen.getByTestId("market-stat-players-skeleton")).toBeInTheDocument();
		expect(screen.getByRole("heading", { name: "Games in the last 28 days" })).toBeInTheDocument();
		expect(screen.getByText("vs 200 in the previous 28 days")).toBeInTheDocument();
		expect(screen.queryByRole("heading", { name: "Weekly activity" })).not.toBeInTheDocument();
		expect(
			screen.queryByRole("heading", { name: EN_MESSAGES.facilityDetail.popularTimes }),
		).not.toBeInTheDocument();
		// The Markets title is now the "Active markets" label with a Games-style header.
		expect(screen.queryByRole("heading", { name: "Markets" })).not.toBeInTheDocument();
		expect(screen.getByRole("heading", { level: 3, name: "Active markets" })).toBeInTheDocument();
		expect(screen.getByTestId("markets-hero")).toHaveTextContent("8");
		expect(screen.getByTestId("markets-hero-comparison")).toHaveTextContent(/^4 inactive$/);
		expect(screen.getByTestId("markets-hero").querySelector("[data-tone]")).toBeNull();
		expect(screen.getByTestId("facilities-hero").querySelector("[data-tone]")).toBeNull();
		// Games keeps its comparison.
		expect(screen.getByText("vs 200 in the previous 28 days")).toBeInTheDocument();
		expect(screen.getByText("6 of 9 active")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /Pegaso Soccer Miami/ })).toBeInTheDocument();
		expect(screen.getByText(VIEW.lastPlayedLabel)).toBeInTheDocument();
	});

	it("lays the modules out as flat sections split by the drill-down divider, without cards", () => {
		mockRules.mockReturnValue(rulesWith());

		render(<InsightPanel {...PROPS} />);

		const sections = screen.getByTestId("market-summary-sections");
		// 12px spacing; dividers only between two unboxed sections.
		expect(sections).toHaveClass(
			"flex",
			"gap-[12px]",
			"[&>:not([data-boxed])+:not([data-boxed])]:border-t",
			"[&>:not([data-boxed])+:not([data-boxed])]:pt-[12px]",
		);
		expect(sections.className).not.toMatch(/divide-y/);
		expect(sections.children.length).toBeGreaterThanOrEqual(5);
		for (const section of Array.from(sections.children)) {
			expect(section.className).not.toMatch(/(^|\s)py-4/);
		}
		// The boxed Games and Active tiles sections opt out of the dividers.
		expect(screen.getByTestId("market-summary-games")).toHaveAttribute("data-boxed");
		expect(screen.getByTestId("market-summary-facilities")).toHaveAttribute("data-boxed");
		expect(screen.queryByTestId("market-summary-scope-tiles")).not.toBeInTheDocument();
		// Order: Insight, Games, tiles, Markets, Active facilities, footer.
		const order = Array.from(sections.children).map(
			(section) => section.getAttribute("data-testid") ?? section.tagName.toLowerCase(),
		);
		expect(order.indexOf("market-summary-games")).toBeLessThan(
			order.indexOf("market-summary-markets"),
		);
		expect(order.indexOf("market-summary-markets")).toBeLessThan(
			order.indexOf("market-summary-facilities"),
		);
		expect(order.at(-1)).toBe("footer");
		expect(screen.getByTestId("market-summary-insight")).not.toHaveAttribute("data-boxed");
		// The Games title is an h3 styled as a metric label (11px regular, like "Unique players").
		expect(
			screen.getByRole("heading", { level: 3, name: "Games in the last 28 days" }),
		).toHaveClass("text-[11px]", "font-normal", "text-[#525866]", "leading-[13px]");
		// Markets module: boxed like Games, label-styled title.
		expect(screen.getByTestId("market-summary-markets")).toHaveAttribute("data-boxed");
		expect(screen.getByRole("heading", { name: "Active markets" })).toHaveClass(
			"text-[11px]",
			"leading-[13px]",
		);
		expect(screen.getByRole("region", { name: "Active markets" })).toHaveClass(
			"rounded-[10px]",
			"bg-foreground/[0.03]",
			"p-[12px]",
		);
		const cardLike = sections.querySelectorAll(
			"[class*='rounded-xl'], [class*='rounded-[20px]'], [class*='bg-card'], [class~='bg-pleiful-moonlight-5']",
		);
		expect(cardLike).toHaveLength(0);
	});

	it("places the boxed Users module right after Games, without a chart", () => {
		mockRules.mockReturnValue(rulesWith());
		render(<InsightPanel {...PROPS} />);
		const order = Array.from(screen.getByTestId("market-summary-sections").children).map(
			(section) => section.getAttribute("data-testid"),
		);
		expect(order.indexOf("market-summary-users")).toBe(order.indexOf("market-summary-games") + 1);
		const users = screen.getByTestId("market-summary-users");
		expect(users).toHaveAttribute("data-boxed");
		expect(screen.getByRole("heading", { level: 3, name: "Active players" })).toHaveClass(
			"text-[11px]",
			"font-normal",
			"text-[#525866]",
		);
		expect(screen.getByTestId("users-hero")).toHaveTextContent("126");
		expect(screen.getByTestId("users-hero-comparison")).toHaveTextContent("vs 100");
		expect(screen.getByTestId("users-metric-activated")).toHaveTextContent("24");
		expect(users.querySelector("[data-testid='games-chart']")).toBeNull();
	});

	it("puts a 14px icon before each module title, with a 5px gap", () => {
		mockRules.mockReturnValue(rulesWith());
		render(<InsightPanel {...PROPS} />);
		for (const [title, icon] of [
			["Games in the last 28 days", "games"],
			["Active players", "users"],
			["Active markets", "markets"],
		] as const) {
			const heading = screen.getByRole("heading", { level: 3, name: title });
			expect(heading).toHaveClass("flex", "items-center", "gap-[5px]");
			expect(heading.firstElementChild).toHaveAttribute("data-icon", icon);
		}
		const facilitiesTitle = screen.getByTestId("facilities-title-group").querySelector("h3");
		expect(facilitiesTitle?.firstElementChild).toHaveAttribute("data-icon", "facilities");
	});

	it("shows a boxed Users skeleton while player stats load", () => {
		mockRules.mockReturnValue(rulesWith({ view: { ...VIEW, users: null, isUsersPending: true } }));
		render(<InsightPanel {...PROPS} />);
		expect(screen.queryByTestId("market-summary-users")).not.toBeInTheDocument();
		expect(screen.getByTestId("market-summary-users-skeleton")).toHaveAttribute("data-boxed");
	});

	it("hides the scope tiles and rankings a single facility does not need", () => {
		mockRules.mockReturnValue(
			rulesWith({
				heading: {
					title: "Pegaso Soccer Miami",
					subtitle: "Facility summary, last 28 days",
					crumbs: FACILITY_CRUMBS,
				},
				view: {
					...VIEW,
					marketsHero: null,
					facilitiesHero: null,
					topMarkets: null,
					topFacilities: null,
				},
			}),
		);

		render(<InsightPanel {...PROPS} />);

		expect(screen.getByText("Pegaso Soccer Miami")).toHaveAttribute("aria-current", "page");
		expect(screen.queryByText("58 inactive")).not.toBeInTheDocument();
		expect(screen.queryByRole("heading", { name: "Active markets" })).not.toBeInTheDocument();
		expect(screen.queryByRole("heading", { name: "Active facilities" })).not.toBeInTheDocument();
	});

	it("shows the AI skeleton, not the template, while player analytics load even when insights are ready", () => {
		mockRules.mockReturnValue(rulesWith({ isSummaryPending: true, aiContext: null }));

		render(<InsightPanel {...PROPS} />);

		expect(screen.getByTestId("market-summary-text-skeleton")).toBeInTheDocument();
		expect(screen.queryByRole("heading", { name: "Key insights" })).not.toBeInTheDocument();
	});

	it("falls back to the written insights once player analytics are done without AI", () => {
		mockRules.mockReturnValue(rulesWith({ isSummaryPending: false, aiContext: null }));

		render(<InsightPanel {...PROPS} />);

		expect(screen.queryByTestId("market-summary-text-skeleton")).not.toBeInTheDocument();
		expect(screen.getByRole("heading", { name: "Key insights" })).toBeInTheDocument();
	});

	it("shows a sentence skeleton while player analytics load", () => {
		mockRules.mockReturnValue(
			rulesWith({ isSummaryPending: true, view: { ...VIEW, summary: null } }),
		);

		render(<InsightPanel {...PROPS} />);

		expect(screen.getByTestId("market-summary-text-skeleton")).toBeInTheDocument();
	});

	it("omits a close button and reports the end of the closing animation", () => {
		const rules = rulesWith({ isClosing: true });
		mockRules.mockReturnValue(rules);

		render(<InsightPanel {...PROPS} isClosing />);
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
		const { unmount } = render(<InsightPanel {...PROPS} />);
		expect(screen.getByTestId("market-summary-skeleton")).toBeInTheDocument();
		unmount();

		mockRules.mockReturnValue(rulesWith({ status: "error", view: null }));
		render(<InsightPanel {...PROPS} />);
		expect(screen.getByRole("alert")).toHaveTextContent("Could not load the market summary.");
	});

	it.each([
		["All markets", "All facilities and markets, last 28 days"],
		["Houston", "Market, last 28 days"],
		["Padel Club", "Facility summary, last 28 days"],
	])(
		"pins the %s header above the only scroll area, with a full-width divider",
		(title, subtitle) => {
			for (const status of ["ready", "loading", "error"] as const) {
				mockRules.mockReturnValue(
					rulesWith({
						heading: { title, subtitle, crumbs: [{ ...ALL_CRUMB, label: title, title }] },
						status,
						view: status === "ready" ? VIEW : null,
					}),
				);
				const { unmount } = render(<InsightPanel {...PROPS} />);

				const panel = screen.getByRole("complementary");
				const header = screen.getByTestId("market-summary-header");
				const body = screen.getByTestId("market-summary-body");
				expect(header.parentElement).toBe(panel);
				expect(body.parentElement).toBe(panel);
				expect(header.nextElementSibling).toBe(body);
				expect(header).toHaveClass("shrink-0", "border-b", "border-border", "px-5");
				expect(body).toHaveClass("min-h-0", "flex-1", "overflow-y-auto");
				expect(body).not.toContainElement(header);
				expect(panel.querySelectorAll("[class*='overflow-y-auto']")).toHaveLength(1);
				expect(
					screen.getByRole("heading", { level: 2, name: "Insight panel" }),
				).toBeInTheDocument();
				expect(header).toHaveTextContent(`Insight panel${title}`);
				// The old subtitle line is replaced by the breadcrumb.
				expect(header).not.toHaveTextContent(subtitle);
				unmount();
			}
		},
	);
	it("shows only the current All markets crumb at the top level", () => {
		mockRules.mockReturnValue(rulesWith());
		render(<InsightPanel {...PROPS} />);

		const nav = screen.getByRole("navigation", { name: "Breadcrumb" });
		expect(screen.getByTestId("market-summary-header")).toContainElement(nav);
		expect(within(nav).getByText("All markets")).toHaveAttribute("aria-current", "page");
		expect(within(nav).queryByRole("button")).not.toBeInTheDocument();
		expect(screen.getByTestId("market-summary-header")).toHaveTextContent(
			"Insight panelAll markets",
		);
	});

	it("navigates up from a market crumb trail", () => {
		const rules = rulesWith({
			heading: {
				title: "Miami Metro",
				subtitle: "Market summary, last 28 days",
				crumbs: FACILITY_CRUMBS.slice(0, 2).map((crumb, index) =>
					index === 1 ? { ...crumb, target: null } : crumb,
				),
			},
		});
		mockRules.mockReturnValue(rules);
		render(<InsightPanel {...PROPS} />);

		const nav = screen.getByRole("navigation", { name: "Breadcrumb" });
		expect(within(nav).getByText("Miami Metro")).toHaveAttribute("aria-current", "page");
		fireEvent.click(within(nav).getByRole("button", { name: "All markets" }));
		expect(rules.selectCrumb).toHaveBeenCalledWith({ kind: "all" });
	});

	it("navigates to All markets or the market from a facility crumb trail", () => {
		const rules = rulesWith({
			heading: {
				title: "Pegaso Soccer Miami",
				subtitle: "Facility summary, last 28 days",
				crumbs: FACILITY_CRUMBS,
			},
		});
		mockRules.mockReturnValue(rules);
		render(<InsightPanel {...PROPS} />);

		const nav = screen.getByRole("navigation", { name: "Breadcrumb" });
		expect(nav).toHaveTextContent("All markets/Miami Metro/Pegaso Soccer Miami");
		const current = within(nav).getByText("Pegaso Soccer Miami");
		expect(current).toHaveAttribute("aria-current", "page");
		expect(current).toHaveAttribute("title", "Facility: Pegaso Soccer Miami");
		expect(nav.querySelector("ol")).toHaveClass("flex-nowrap");
		// Drill-down header format: fixed title, breadcrumb as the description line.
		const header = screen.getByTestId("market-summary-header");
		const heading = screen.getByRole("heading", { level: 2, name: "Insight panel" });
		expect(header.querySelectorAll("h2")).toHaveLength(1);
		expect(heading).toHaveClass("truncate", "text-base", "font-semibold");
		expect(heading).toHaveAttribute("aria-describedby", current.id);
		// Same font style as the drill-down header: shared title and description classes.
		expect(heading).toHaveClass(...PANEL_TITLE_CLASS.split(" "));
		expect(nav.parentElement).toHaveClass(...PANEL_DESCRIPTION_CLASS.split(" "));
		expect(current.className).not.toMatch(/text-foreground|font-|text-\[1[23]px\]/);
		expect(within(header).getAllByText("Pegaso Soccer Miami")).toHaveLength(1);
		expect(header).not.toHaveTextContent("Facility summary");
		fireEvent.click(within(nav).getByRole("button", { name: "Miami Metro" }));
		expect(rules.selectCrumb).toHaveBeenLastCalledWith({
			kind: "market",
			id: "mia",
			name: "Miami Metro",
		});
		fireEvent.click(within(nav).getByRole("button", { name: "All markets" }));
		expect(rules.selectCrumb).toHaveBeenLastCalledWith({ kind: "all" });
	});

	it("opens a facility from the top facilities list", () => {
		const rules = rulesWith();
		mockRules.mockReturnValue(rules);
		render(<InsightPanel {...PROPS} />);

		fireEvent.click(screen.getByRole("button", { name: /Pegaso Soccer Miami/ }));
		expect(rules.selectFacility).toHaveBeenCalledWith(
			expect.objectContaining({ id: "77", marketName: "Miami Metro" }),
		);
	});
	it("renders the old facility drawer content inside the panel at the Facility level", () => {
		mockRules.mockReturnValue(
			rulesWith({
				heading: { title: "Pegaso Soccer Miami", subtitle: "", crumbs: FACILITY_CRUMBS },
				view: {
					...VIEW,
					marketsHero: null,
					facilitiesHero: null,
					topMarkets: null,
					topFacilities: null,
				},
				facilityView: {
					name: "Pegaso Soccer Miami",
					address: "123 Biscayne Blvd, Miami",
					avatarUrl: null,
					popularTimes: [],
					dayLabels: [...EN_MESSAGES.facilityDetail.dayLabels],
					timePeriodLabels: [...EN_MESSAGES.facilityDetail.timePeriodLabels],
				},
			}),
		);
		render(<InsightPanel {...PROPS} />);

		const sections = screen.getByTestId("market-summary-sections");
		expect(screen.getByTestId("facility-level-profile")).toHaveTextContent(
			"123 Biscayne Blvd, Miami",
		);
		expect(sections.firstElementChild).toBe(screen.getByTestId("facility-level-profile"));
		const popular = screen.getByRole("heading", {
			name: EN_MESSAGES.facilityDetail.popularTimes,
		});
		expect(popular).toHaveClass("text-base", "font-semibold");
		expect(screen.getByTestId("facility-level-popular-times")).not.toHaveAttribute("data-boxed");
		// The games module stays the single games chart; no second weekly chart from the drawer.
		expect(screen.queryByRole("heading", { name: "Weekly activity" })).not.toBeInTheDocument();
		expect(screen.queryByRole("complementary", { name: "Facility details" })).toBeNull();
	});
});
