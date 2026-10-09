import type { StatsPeriod } from "@market-health-map/core/application";
import { getMessages } from "@market-health-map/core/i18n";
import { act, renderHook } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { FACILITY_DETAIL } from "@/application/test/facility-detail";
import {
	MARKET_AUDIENCE,
	MARKET_PLAYER_STATS,
	MARKET_SUMMARY,
} from "@/application/test/market-summary";
import { EN_MESSAGES } from "@/application/test/messages";
import { createDetailFormatters } from "@/presentation/components/map/FacilityDetailPanel/FacilityDetailPanelComponent.rules";
import {
	buildFacilitiesHero,
	buildFacilityRows,
	buildFacilitySummaryViewModel,
	buildMarketAiSubject,
	buildMarketRows,
	buildMarketSummaryText,
	buildMarketSummaryViewModel,
	buildMarketsHero,
	buildScopeCrumbs,
	buildScopeHeading,
	contributorFactsFrom,
	formatChangePercent,
	marketTrendStatusOf,
	useInsightPanelRules,
} from "@/presentation/components/map/InsightPanel/InsightPanelComponent.rules";
import type { MapScope } from "@/presentation/components/providers/MapScopeProvider/MapScopeProviderComponent.types";
import { MessagesProvider } from "@/presentation/components/providers/MessagesProvider/MessagesProviderComponent";

const mockUseMarketGameInsights = vi
	.fn()
	.mockReturnValue({ data: [], isPending: false, isError: false });
vi.mock("@/presentation/hooks/use-market/use-market-game-insights", () => ({
	useMarketGameInsights: (...args: unknown[]) => mockUseMarketGameInsights(...args),
}));
const mockUseMarketSummary = vi.fn();
const mockUseMarketPlayerStats = vi.fn();
const mockUseFacilityReservationStats = vi.fn();
const mockUseFacilityPlayerStats = vi.fn();
const mockSetMapNavigation = vi.fn();
let mockScope: MapScope = { kind: "all" };
let mockPeriod: StatsPeriod = "month";

vi.mock("@/presentation/hooks/use-market/use-market-summary", () => ({
	useMarketSummary: (...args: unknown[]) => mockUseMarketSummary(...args),
}));

let mockDepartments: string[] = [];
vi.mock("@/presentation/hooks/use-market/use-market-summary-filters", () => ({
	useMarketSummaryFilters: () => ({ departments: mockDepartments }),
}));

const mockUseMarketAudience = vi.fn();
vi.mock("@/presentation/hooks/use-market/use-market-audience", () => ({
	useMarketAudience: (...args: unknown[]) => mockUseMarketAudience(...args),
}));

vi.mock("@/presentation/hooks/use-market/use-market-player-stats", () => ({
	useMarketPlayerStats: (...args: unknown[]) => mockUseMarketPlayerStats(...args),
}));

vi.mock("@/presentation/hooks/use-facility/use-facility-reservation-stats", () => ({
	useFacilityReservationStats: (...args: unknown[]) => mockUseFacilityReservationStats(...args),
}));

vi.mock("@/presentation/hooks/use-facility/use-facility-player-stats", () => ({
	useFacilityPlayerStats: (...args: unknown[]) => mockUseFacilityPlayerStats(...args),
}));

vi.mock("@/presentation/components/providers/MapScopeProvider/MapScopeProviderComponent", () => ({
	useMapScope: () => ({
		scope: mockScope,
		setScope: vi.fn(),
		setMapNavigation: mockSetMapNavigation,
		period: mockPeriod,
	}),
}));

const IDLE_QUERY = { data: undefined, isPending: true, isError: false };
const {
	uniquePlayersLastWeek,
	uniquePlayersPreviousWeek,
	activatedPlayersLastWeek,
	activatedPlayersPreviousWeek,
	uniquePlayersLast28Days,
	uniquePlayersPrevious28Days,
	activatedPlayersLast28Days,
	activatedPlayersPrevious28Days,
	uniquePlayersPeriodChangePercent,
	activatedPlayersPeriodChangePercent,
	...FACILITY_RESERVATION_STATS
} = FACILITY_DETAIL.stats;
const FACILITY_REPORT = {
	facility: FACILITY_DETAIL.facility,
	stats: FACILITY_RESERVATION_STATS,
};

const messages = EN_MESSAGES.marketSummary;
const detailMessages = EN_MESSAGES.facilityDetail;
const MONTH = EN_MESSAGES.statsPeriods.month;
const WEEK = EN_MESSAGES.statsPeriods.week;
const formatters = createDetailFormatters("en");

function wrapper({ children }: { children: ReactNode }) {
	return createElement(MessagesProvider, { locale: "en", messages: EN_MESSAGES, children });
}

describe("market summary builders", () => {
	it("agrees the inactive fallback with the noun and number in Spanish", () => {
		const es = getMessages("es").marketSummary;
		const esFormatters = createDetailFormatters("es");
		const scope = {
			...MARKET_SUMMARY.periods.month.scope,
			facilityCount: 2,
			activeFacilityCount: 1,
			marketCount: 3,
			activeMarketCount: 3,
		};
		expect(buildFacilitiesHero(scope, es, esFormatters).comparison).toBe("1 inactiva");
		expect(buildMarketsHero(scope, es, esFormatters).comparison).toBe("0 inactivos");
	});

	it("writes the network-wide sentence once player analytics arrive", () => {
		expect(
			buildMarketSummaryText(
				MARKET_SUMMARY,
				undefined,
				"month",
				messages,
				detailMessages,
				MONTH,
				formatters,
			),
		).toBeNull();
		expect(
			buildMarketSummaryText(
				MARKET_SUMMARY,
				MARKET_PLAYER_STATS,
				"month",
				messages,
				detailMessages,
				MONTH,
				formatters,
			),
		).toBe(
			"Activated players: 20% versus the previous 28 days (20 → 24). Games played: 6% versus the previous 28 days (200 → 212).",
		);
		expect(
			buildMarketSummaryText(
				{ ...MARKET_SUMMARY, stats: { ...MARKET_SUMMARY.stats, playedLast28Days: 0 } },
				MARKET_PLAYER_STATS,
				"month",
				messages,
				detailMessages,
				MONTH,
				formatters,
			),
		).toBe("No games were played in any market in the last 28 days.");
	});

	it("ranks markets and facilities with localized game counts", () => {
		expect(
			buildMarketRows(
				MARKET_SUMMARY.periods.month.topMarkets,
				undefined,
				messages,
				detailMessages,
				MONTH,
				formatters,
			),
		).toEqual([
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
		]);
		expect(
			buildFacilityRows(
				MARKET_SUMMARY.periods.month.topFacilities,
				undefined,
				messages,
				detailMessages,
				MONTH,
				formatters,
			).map((row) => `${row.rank}. ${row.name} (${row.detail}): ${row.value} ${row.changeLabel}`),
		).toEqual([
			"1. Pegaso HTX (Houston): 41 games \u2014",
			"2. Phield House (Philadelphia): 1 game \u2014",
		]);
	});

	it("gives each facility row its vs prev pill from the market game comparison", () => {
		const changes = [
			{
				id: "houston",
				name: "Houston",
				played: 41,
				playedPrevious: 30,
				change: 11,
				changePercent: 36.7,
				facilities: [
					{
						id: "889",
						name: "Pegaso HTX",
						played: 41,
						playedPrevious: 50,
						change: -9,
						changePercent: -18,
					},
				],
			},
			{
				id: "philadelphia",
				name: "Philadelphia",
				played: 1,
				playedPrevious: 0,
				change: 1,
				changePercent: null,
				facilities: [
					{
						id: "292",
						name: "Phield House",
						played: 1,
						playedPrevious: 0,
						change: 1,
						changePercent: null,
					},
				],
			},
		];
		const rows = buildFacilityRows(
			MARKET_SUMMARY.periods.month.topFacilities,
			changes,
			messages,
			detailMessages,
			MONTH,
			formatters,
		);
		expect(rows[0]).toMatchObject({ changePercent: -18, changeDirection: "down" });
		expect(rows[0]?.changeLabel).toMatch(/18%/);
		expect(rows[0]?.ariaLabel).toContain("versus");
		// No previous games: a dash and the "no previous games" description, never a made-up %.
		expect(rows[1]).toMatchObject({
			changePercent: null,
			changeDirection: null,
			changeLabel: "\u2014",
		});
		expect(rows[1]?.ariaLabel).toContain(messages.changeUnavailable);
	});

	it("builds the whole view and falls back when nothing was played yet", () => {
		const view = buildMarketSummaryViewModel(
			MARKET_SUMMARY,
			MARKET_PLAYER_STATS,
			false,
			"month",
			messages,
			detailMessages,
			MONTH,
			formatters,
		);
		// Unique and activated players moved from tiles into the Users module.
		expect(view.tiles).toEqual([]);
		expect(view.users?.title).toBe("Active players");
		// Active players = activated (first game) players; Unique users = unique players.
		expect(view.users?.hero.value).toBe("24");
		// No audience passed: only the Unique users row.
		expect(view.users?.rows.map((row) => [row.key, row.value])).toEqual([["uniqueUsers", "126"]]);
		// Last four of the eight weeks the API returns.
		expect(view.users?.series.map((point) => point.value)).toEqual([7, 6, 5, 6]);
		expect(view.isUsersPending).toBe(false);
		expect(view.games.title).toBe("Games in the last 28 days");
		expect(view.games.hero).toMatchObject({
			value: "212",
			comparison: "vs 200 in the previous 28 days",
			change: { label: "+6%", tone: "better" },
		});
		expect(
			view.games.rows.map((row) => [row.key, row.value, row.previousLabel, row.change?.label]),
		).toEqual([
			["confirmation", "84.8%", "vs 83.3%", "+1.5 pts"],
			["cancellation", "51.2%", "vs 53.3%", "\u22122.1 pts"],
			["posted", "250", "vs 240", "+4%"],
		]);
		expect(view.games.series.map((point) => [point.label, point.valueLabel])).toEqual([
			["Aug 31", "48"],
			["Sep 7", "58"],
			["Sep 14", "51"],
			["Sep 21", "55"],
		]);
		expect(view).not.toHaveProperty("weeklyActivity");
		expect(view).not.toHaveProperty("popularTimes");
		expect(view.lastPlayedLabel).toBe("Last game played Sep 27, 2026");

		const empty = buildMarketSummaryViewModel(
			{ ...MARKET_SUMMARY, stats: { ...MARKET_SUMMARY.stats, lastPlayedDate: null } },
			undefined,
			true,
			"month",
			messages,
			detailMessages,
			MONTH,
			formatters,
		);
		expect(empty.lastPlayedLabel).toBe(detailMessages.neverPlayed);
		expect(empty.tiles).toEqual([]);
		expect(empty.users).toBeNull();
		expect(empty.isUsersPending).toBe(true);
		expect(view.topMarkets).toHaveLength(1);
		expect(view).not.toHaveProperty("scopeTiles");
		expect(view.marketsHero?.value).toBe("10");
		expect(view.facilitiesHero?.value).toBe("84");
		expect(view.topFacilities?.[0]).toMatchObject({
			gamesLabel: "41",
			ariaLabel: "Pegaso HTX, Houston: 41 games",
			games: 41,
			changeDirection: null,
			status: null,
		});
	});

	it("drops the markets tile and ranking when scoped to one market", () => {
		const view = buildMarketSummaryViewModel(
			{ ...MARKET_SUMMARY, stats: { ...MARKET_SUMMARY.stats, playedLast28Days: 0 } },
			MARKET_PLAYER_STATS,
			false,
			"month",
			messages,
			detailMessages,
			MONTH,
			formatters,
			true,
		);

		expect(view.topMarkets).toBeNull();
		expect(view.topFacilities).toHaveLength(2);
		// Market level: no Markets module, but the Active facilities header stays.
		expect(view.marketsHero).toBeNull();
		expect(view.facilitiesHero).not.toBeNull();
		expect(view.summary).toBe("No games were played in this market in the last 28 days.");
	});

	it("builds a facility view without scope tiles or rankings", () => {
		const view = buildFacilitySummaryViewModel(
			FACILITY_RESERVATION_STATS,
			MARKET_PLAYER_STATS,
			false,
			"month",
			detailMessages,
			MONTH,
			formatters,
			messages,
		);

		expect(view.marketsHero).toBeNull();
		expect(view.facilitiesHero).toBeNull();
		expect(view.games.rows.map((row) => row.key)).toEqual([
			"confirmation",
			"cancellation",
			"posted",
		]);
		expect(view.topMarkets).toBeNull();
		expect(view.topFacilities).toBeNull();
		expect(view.summary).toContain("Games played: 6%");
		expect(view).not.toHaveProperty("popularTimes");
		expect(
			buildFacilitySummaryViewModel(
				FACILITY_RESERVATION_STATS,
				undefined,
				true,
				"month",
				detailMessages,
				MONTH,
				formatters,
				messages,
			).summary,
		).toBeNull();
	});

	it("titles the drawer after its scope", () => {
		expect(buildScopeHeading({ kind: "all" }, messages, MONTH)).toMatchObject({
			title: "All markets",
			subtitle: "All facilities and markets, last 28 days",
		});
		expect(
			buildScopeHeading({ kind: "market", id: "houston", name: "Houston" }, messages, WEEK),
		).toMatchObject({ title: "Houston", subtitle: "Market summary, last 7 days" });
		expect(
			buildScopeHeading({ kind: "market", id: "houston", name: "Houston" }, messages, MONTH),
		).toMatchObject({ title: "Houston", subtitle: "Market summary, last 28 days" });
		expect(
			buildScopeHeading(
				{ kind: "facility", id: "889", name: "Pegaso HTX", marketName: "Houston" },
				messages,
				MONTH,
			),
		).toMatchObject({ title: "Pegaso HTX", subtitle: "Facility summary, last 28 days" });
	});
});

describe("active count headers", () => {
	const scope = {
		facilityCount: 20,
		activeFacilityCount: 12,
		marketCount: 12,
		activeMarketCount: 8,
	};

	it("shows the active count and only the inactive count below it, with no comparison", () => {
		expect(buildFacilitiesHero(scope, messages, formatters)).toEqual({
			value: "12",
			change: null,
			comparison: "8 inactive",
		});
		expect(buildMarketsHero(scope, messages, formatters)).toEqual({
			value: "8",
			change: null,
			comparison: "4 inactive",
		});
	});
});

describe("buildScopeCrumbs", () => {
	it("shows only All markets, as the current crumb, at the top level", () => {
		expect(buildScopeCrumbs({ kind: "all" }, messages)).toEqual([
			{ key: "all", label: "All markets", title: "All markets", target: null },
		]);
	});

	it("links All markets from a market and makes the market current", () => {
		expect(buildScopeCrumbs({ kind: "market", id: "mia", name: "Miami Metro" }, messages)).toEqual([
			{ key: "all", label: "All markets", title: "All markets", target: { kind: "all" } },
			{ key: "market", label: "Miami Metro", title: "Market: Miami Metro", target: null },
		]);
	});

	it("links All markets and the facility's market from a facility", () => {
		expect(
			buildScopeCrumbs(
				{
					kind: "facility",
					id: "889",
					name: "Pegaso Soccer Miami",
					marketName: "Miami Metro",
					marketId: "mia",
				},
				messages,
			),
		).toEqual([
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
		]);
	});

	it("keeps the market crumb as plain text when the facility's market id is unknown", () => {
		const crumbs = buildScopeCrumbs(
			{ kind: "facility", id: "889", name: "Pegaso HTX", marketName: "Houston" },
			messages,
		);
		expect(crumbs.map((crumb) => [crumb.label, crumb.target])).toEqual([
			["All markets", { kind: "all" }],
			["Houston", null],
			["Pegaso HTX", null],
		]);
	});

	it("uses the translated level label in Spanish", () => {
		const es = getMessages("es").marketSummary;
		expect(
			buildScopeCrumbs({ kind: "market", id: "mia", name: "Miami Metro" }, es).map(
				(crumb) => crumb.title,
			),
		).toEqual(["Todos los mercados", "Mercado: Miami Metro"]);
	});
});

describe("useInsightPanelRules", () => {
	beforeEach(() => {
		mockScope = { kind: "all" };
		mockPeriod = "month";
		mockDepartments = [];
		mockUseMarketGameInsights.mockReturnValue({ data: [], isPending: false, isError: false });
		mockUseFacilityReservationStats.mockReturnValue(IDLE_QUERY);
		mockUseFacilityPlayerStats.mockReturnValue(IDLE_QUERY);
		mockUseMarketSummary.mockReturnValue({
			data: MARKET_SUMMARY,
			isPending: false,
			isError: false,
		});
		mockUseMarketPlayerStats.mockReturnValue({
			data: MARKET_PLAYER_STATS,
			isPending: false,
			isError: false,
		});
		mockUseMarketAudience.mockReturnValue({
			data: MARKET_AUDIENCE,
			isPending: false,
			isError: false,
		});
	});

	function renderRules(isClosing = false) {
		const onClose = vi.fn();
		const onClosed = vi.fn();
		const rendered = renderHook(
			(props: { isClosing: boolean }) => useInsightPanelRules({ onClose, onClosed, ...props }),
			{ wrapper, initialProps: { isClosing } },
		);
		return { ...rendered, onClose, onClosed };
	}

	it("keeps the card ready while insights are pending or fail", () => {
		mockUseMarketGameInsights.mockReturnValue(IDLE_QUERY);
		const { result, rerender } = renderRules();
		expect(result.current.status).toBe("ready");
		expect(result.current.view?.users?.hero.value).toBeTruthy();
		expect(result.current.view?.games.series.length).toBeGreaterThan(0);
		// "See all N" counts the full ranked lists the summary now returns.
		expect(result.current.seeAllFacilitiesLabel).toBe("See all 2 facilities");
		expect(result.current.seeAllMarketsLabel).toBe("See all 1 markets");
		expect(result.current.view?.summary).toBeNull();
		expect(result.current.isSummaryPending).toBe(true);
		mockUseMarketGameInsights.mockReturnValue({ data: undefined, isPending: false, isError: true });
		rerender({ isClosing: false });
		expect(result.current.status).toBe("ready");
		expect(result.current.isInsightsFailed).toBe(true);
		expect(result.current.view?.users?.hero.value).toBeTruthy();
	});
	it("defers insights until the main report arrives and disables them for facility scope", () => {
		mockUseMarketSummary.mockReturnValue(IDLE_QUERY);
		const { rerender } = renderRules();
		expect(mockUseMarketGameInsights).toHaveBeenLastCalledWith(null, "month", false, []);
		mockUseMarketSummary.mockReturnValue({
			data: MARKET_SUMMARY,
			isPending: false,
			isError: false,
		});
		rerender({ isClosing: false });
		expect(mockUseMarketGameInsights).toHaveBeenLastCalledWith(null, "month", true, []);
		mockScope = { kind: "facility", id: "889", name: "Pegaso HTX", marketName: "Houston" };
		rerender({ isClosing: false });
		expect(mockUseMarketGameInsights).toHaveBeenLastCalledWith(null, "month", false, []);
	});
	it("builds the market-wide view", () => {
		const { result } = renderRules();

		expect(result.current.status).toBe("ready");
		expect(result.current.view?.marketsHero).not.toBeNull();
		expect(result.current.view?.facilitiesHero).not.toBeNull();
		expect(result.current.view?.summary).toContain("Activated players: 20%");
		expect(result.current.isSummaryPending).toBe(false);
		expect(result.current.messages).toBe(messages);
		expect(result.current.heading.title).toBe("All markets");
		expect(mockUseMarketSummary).toHaveBeenLastCalledWith(null, true, []);
		expect(mockUseMarketPlayerStats).toHaveBeenLastCalledWith(null, true, []);
		expect(mockUseFacilityReservationStats).toHaveBeenLastCalledWith(null);
		expect(mockUseMarketAudience).toHaveBeenLastCalledWith(null, true);
		expect(
			result.current.view?.users?.rows.map((row) => [
				row.key,
				row.value,
				row.previousLabel,
				row.change?.label ?? null,
			]),
		).toEqual([
			["registrations", "450", "vs 500", "\u221210%"],
			["activeUsers", "12,000", "vs 10,000", "+20%"],
			["uniqueUsers", "126", "vs 120", "+5%"],
		]);
	});

	it("shows placeholder audience rows while they load and only Unique users if they fail", () => {
		mockUseMarketAudience.mockReturnValue({ data: undefined, isPending: true, isError: false });
		const { result, rerender } = renderRules();
		expect(result.current.view?.users?.rows.map((row) => [row.key, !!row.isPending])).toEqual([
			["registrations", true],
			["activeUsers", true],
			["uniqueUsers", false],
		]);
		mockUseMarketAudience.mockReturnValue({ data: undefined, isPending: false, isError: true });
		rerender({ isClosing: false });
		expect(result.current.view?.users?.rows.map((row) => row.key)).toEqual(["uniqueUsers"]);
	});

	it("asks for the audience only for all markets or a region with a numeric id", () => {
		const { rerender } = renderRules();
		mockScope = { kind: "market", id: "12", name: "Houston" };
		rerender({ isClosing: false });
		expect(mockUseMarketAudience).toHaveBeenLastCalledWith("12", true);
		mockScope = { kind: "market", id: "unassigned", name: "Unassigned" };
		rerender({ isClosing: false });
		expect(mockUseMarketAudience).toHaveBeenLastCalledWith("unassigned", false);
	});

	it("asks for the summary, insights and players with the Layers department filter", () => {
		mockDepartments = ["magic", "organizers"];
		const { result } = renderRules();

		expect(mockUseMarketSummary).toHaveBeenLastCalledWith(null, true, ["magic", "organizers"]);
		expect(mockUseMarketGameInsights).toHaveBeenLastCalledWith(null, "month", true, [
			"magic",
			"organizers",
		]);
		expect(mockUseMarketPlayerStats).toHaveBeenLastCalledWith(null, true, ["magic", "organizers"]);
		// App registrations and sessions have no game department: no audience rows under a filter.
		expect(mockUseMarketAudience).toHaveBeenLastCalledWith(null, false);
		expect(result.current.view?.users?.rows.map((row) => row.key)).toEqual(["uniqueUsers"]);
		expect(result.current.aiContext?.cacheKey).toContain("all-markets-all~magic+organizers-month");
	});

	it("shows the last 7 days against the 7 days before when the week is selected", () => {
		mockPeriod = "week";
		const { result } = renderRules();

		expect(mockUseMarketGameInsights).toHaveBeenLastCalledWith(null, "week", true, []);
		expect(result.current.heading.subtitle).toBe("All facilities and markets, last 7 days");
		expect(result.current.view?.games.title).toBe("Games in the last 7 days");
		expect(result.current.view?.games.hero.value).toBe("55");
		expect(result.current.view?.games.hero.change?.label).toBe("+8%");
		// 7D charts the same last four weeks as 28D.
		expect(result.current.view?.games.series.map((point) => point.label)).toEqual([
			"Aug 31",
			"Sep 7",
			"Sep 14",
			"Sep 21",
		]);
		expect(
			result.current.view?.games.rows.map((row) => [row.key, row.value, row.change?.label]),
		).toEqual([
			["confirmation", "63.2%", "+4.6 pts"],
			["cancellation", "36.8%", "0 pts"],
			["posted", "87", "0%"],
		]);
		expect(result.current.view?.summary).toContain("versus the previous 7 days");
		expect(result.current.aiContext?.cacheKey).toContain("all-markets-all-week");
		expect(result.current.view?.facilitiesHero?.value).toBe("51");
		expect(result.current.view?.marketsHero?.value).toBe("8");
		expect(result.current.view?.topMarkets?.map((row) => row.gamesLabel)).toEqual(["30"]);
		expect(result.current.view?.topFacilities?.map((row) => row.value)).toEqual(["12 games"]);
		expect(result.current.rankingsEmptyLabel).toBe("No games played in the last 7 days.");
	});

	it("follows a market scope and updates when the filter changes while open", () => {
		const { result, rerender } = renderRules();

		mockScope = { kind: "market", id: "houston", name: "Houston" };
		rerender({ isClosing: false });

		expect(mockUseMarketSummary).toHaveBeenLastCalledWith("houston", true, []);
		expect(mockUseMarketPlayerStats).toHaveBeenLastCalledWith("houston", true, []);
		expect(result.current.heading.title).toBe("Houston");
		expect(result.current.view?.topMarkets).toBeNull();
		expect(result.current.view?.marketsHero).toBeNull();
	});

	it("reuses the facility endpoints for a facility scope and skips the market queries", () => {
		mockScope = { kind: "facility", id: "889", name: "Pegaso HTX", marketName: "Houston" };
		mockUseFacilityReservationStats.mockReturnValue({
			data: FACILITY_REPORT,
			isPending: false,
			isError: false,
		});
		mockUseFacilityPlayerStats.mockReturnValue({
			data: MARKET_PLAYER_STATS,
			isPending: false,
			isError: false,
		});

		const { result } = renderRules();

		expect(mockUseMarketSummary).toHaveBeenLastCalledWith(null, false, []);
		expect(mockUseMarketPlayerStats).toHaveBeenLastCalledWith(null, false, []);
		expect(mockUseFacilityReservationStats).toHaveBeenLastCalledWith("889");
		expect(mockUseFacilityPlayerStats).toHaveBeenLastCalledWith("889");
		// Registrations and app activity are per region: a facility has no audience rows.
		expect(mockUseMarketAudience).toHaveBeenLastCalledWith(null, false);
		expect(result.current.view?.users?.rows.map((row) => row.key)).toEqual(["uniqueUsers"]);
		expect(result.current.status).toBe("ready");
		expect(result.current.heading).toMatchObject({
			title: "Pegaso HTX",
			subtitle: "Facility summary, last 28 days",
		});
		expect(result.current.view?.topFacilities).toBeNull();
		// The old facility drawer's extra content now lives in the panel's Facility level.
		expect(result.current.facilityView).toMatchObject({
			name: FACILITY_DETAIL.facility.name,
			address: FACILITY_DETAIL.facility.address,
			dayLabels: detailMessages.dayLabels,
			timePeriodLabels: detailMessages.timePeriodLabels,
		});
		expect(result.current.facilityView?.popularTimes).toHaveLength(
			detailMessages.dayLabels.length * detailMessages.timePeriodLabels.length,
		);
	});

	it("has no facility content outside the Facility level", () => {
		const { result } = renderRules();
		expect(result.current.facilityView).toBeNull();
	});

	it("moves focus to the panel heading when the level changes, not on first open", () => {
		const heading = document.createElement("h2");
		heading.id = "market-summary-heading";
		heading.tabIndex = -1;
		document.body.append(heading);
		mockScope = { kind: "all" };
		const { rerender } = renderRules();
		expect(heading).not.toHaveFocus();

		mockScope = { kind: "market", id: "mia", name: "Miami Metro" };
		rerender({ isClosing: false });
		expect(heading).toHaveFocus();

		heading.blur();
		rerender({ isClosing: false });
		expect(heading).not.toHaveFocus();
		heading.remove();
	});

	it("scrolls the panel back to the top when the level changes, not on first open", () => {
		const body = document.createElement("div");
		mockScope = { kind: "all" };
		const { result, rerender } = renderRules();
		result.current.bodyRef.current = body;
		body.scrollTop = 400;
		rerender({ isClosing: false });
		expect(body.scrollTop).toBe(400);

		mockScope = { kind: "market", id: "mia", name: "Miami Metro" };
		rerender({ isClosing: false });
		expect(body.scrollTop).toBe(0);

		body.scrollTop = 250;
		mockScope = {
			kind: "facility",
			id: "889",
			name: "Pegaso HTX",
			marketName: "Miami Metro",
			marketId: "mia",
		};
		rerender({ isClosing: false });
		expect(body.scrollTop).toBe(0);
	});

	it("navigates crumbs, market rows and facility rows through the shared map navigation", () => {
		mockScope = {
			kind: "facility",
			id: "889",
			name: "Pegaso HTX",
			marketName: "Houston",
			marketId: "houston",
		};
		mockSetMapNavigation.mockClear();
		const { result } = renderRules();

		expect(result.current.heading.crumbs.map((crumb) => crumb.label)).toEqual([
			"All markets",
			"Houston",
			"Pegaso HTX",
		]);
		act(() => result.current.selectCrumb({ kind: "all" }));
		expect(mockSetMapNavigation).toHaveBeenLastCalledWith({ kind: "all" });
		act(() => result.current.selectCrumb({ kind: "market", id: "houston", name: "Houston" }));
		expect(mockSetMapNavigation).toHaveBeenLastCalledWith({
			kind: "market",
			id: "houston",
			name: "Houston",
		});
		act(() =>
			result.current.selectFacility({
				key: "77",
				id: "77",
				marketName: "Miami Metro",
				rank: 1,
				name: "Pegaso Soccer Miami",
				games: 12,
				gamesLabel: "12",
				status: null,
				statusLabel: null,
				changePercent: null,
				changeDirection: null,
				changeLabel: "",
				ariaLabel: "Pegaso Soccer Miami, Miami Metro: 12 games",
				detail: "Miami Metro",
				value: "12 games",
			}),
		);
		expect(mockSetMapNavigation).toHaveBeenLastCalledWith({
			kind: "facility",
			id: "77",
			name: "Pegaso Soccer Miami",
			marketName: "Miami Metro",
		});
	});

	it("shows the loading state while a facility report is pending", () => {
		mockScope = { kind: "facility", id: "889", name: "Pegaso HTX", marketName: "Houston" };

		const { result } = renderRules();

		expect(result.current.status).toBe("loading");
		expect(result.current.view).toBeNull();
	});

	it("shows the loading state before the summary arrives", () => {
		mockUseMarketSummary.mockReturnValue({ data: undefined, isPending: true, isError: false });
		mockUseMarketPlayerStats.mockReturnValue({ data: undefined, isPending: true, isError: false });

		const { result } = renderRules();

		expect(result.current.status).toBe("loading");
		expect(result.current.view).toBeNull();
		expect(result.current.isSummaryPending).toBe(false);
	});

	it("stays pending until player analytics arrive even when insights are ready", () => {
		mockUseMarketPlayerStats.mockReturnValue({ data: undefined, isPending: true, isError: false });

		const { result } = renderRules();

		expect(mockUseMarketGameInsights).toHaveBeenLastCalledWith(null, "month", true, []);
		expect(result.current.aiContext).toBeNull();
		expect(result.current.isSummaryPending).toBe(true);
	});

	it("keeps the summary sentence pending while player analytics load", () => {
		mockUseMarketPlayerStats.mockReturnValue({ data: undefined, isPending: true, isError: false });

		const { result } = renderRules();

		expect(result.current.view?.summary).toBeNull();
		expect(result.current.isSummaryPending).toBe(true);
	});

	it("closes on Escape only and reports the end of the closing animation", () => {
		const { onClose, onClosed, result, rerender, unmount } = renderRules();
		act(() => {
			window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
			window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
		});
		result.current.handleAnimationEnd();
		expect(onClose).toHaveBeenCalledOnce();
		expect(onClosed).not.toHaveBeenCalled();

		rerender({ isClosing: true });
		result.current.handleAnimationEnd();
		expect(onClosed).toHaveBeenCalledOnce();
		unmount();
	});
});

describe("scope-specific game contributors", () => {
	const summary = {
		...MARKET_SUMMARY,
		gameChanges: [
			{
				id: "houston",
				name: "Houston",
				played: 100,
				playedPrevious: 200,
				change: -100,
				changePercent: -50,
				facilities: [
					{
						id: "1",
						name: "Arena A",
						played: 20,
						playedPrevious: 140,
						change: -120,
						changePercent: -85.7,
					},
					{
						id: "2",
						name: "Arena B",
						played: 80,
						playedPrevious: 60,
						change: 20,
						changePercent: 33.3,
					},
				],
			},
			{
				id: "philly",
				name: "Philadelphia",
				played: 80,
				playedPrevious: 0,
				change: 80,
				changePercent: null,
				facilities: [],
			},
		],
	};
	it("states the overall change as a signed number of games, so it can't be read as a percentage", () => {
		const grew = buildMarketSummaryText(
			{ ...summary, stats: { ...summary.stats, playedPrevious28Days: 24, playedLast28Days: 33 } },
			undefined,
			"month",
			messages,
			detailMessages,
			MONTH,
			formatters,
		);
		const fell = buildMarketSummaryText(
			{ ...summary, stats: { ...summary.stats, playedPrevious28Days: 33, playedLast28Days: 24 } },
			undefined,
			"month",
			messages,
			detailMessages,
			MONTH,
			formatters,
		);

		expect(grew).toContain(
			"Overall games: 24 → 33, a net change of +9 games versus the previous 28 days.",
		);
		expect(fell).toContain(
			"Overall games: 33 → 24, a net change of -9 games versus the previous 28 days.",
		);
	});
	it("gives the AI only the contributor lines, never the overall total", () => {
		const text = buildMarketSummaryText(
			summary,
			undefined,
			"month",
			messages,
			detailMessages,
			MONTH,
			formatters,
		);
		const facts = contributorFactsFrom(text) ?? "";

		expect(facts).not.toContain("Overall games");
		expect(facts).toContain("Houston: games declined");
		expect(facts).toContain("contribution to the overall change: +80 games");
		expect(contributorFactsFrom("Only one paragraph.")).toBeUndefined();
		expect(contributorFactsFrom(null)).toBeUndefined();
	});
	it("names markets and their contributions without facilities in all-markets scope", () => {
		const text = buildMarketSummaryText(
			summary,
			undefined,
			"month",
			messages,
			detailMessages,
			MONTH,
			formatters,
		);
		expect(text).toContain("Houston: games declined");
		expect(text).toContain("contribution to the overall change: -100 games");
		expect(text).toContain("Philadelphia: games increased");
		expect(text).toContain("no previous games");
		expect(text).not.toContain("Arena");
	});
	it("names declining and growing facilities in a selected market even when they offset", () => {
		const view = buildMarketSummaryViewModel(
			{
				...summary,
				stats: { ...summary.stats, playedLast28Days: 200, playedPrevious28Days: 200 },
				gameChanges: summary.gameChanges.slice(0, 1).map((market) => ({ ...market, change: 0 })),
			},
			undefined,
			true,
			"month",
			messages,
			detailMessages,
			MONTH,
			formatters,
			true,
		);
		expect(view.summary).toContain("Arena A: games declined");
		expect(view.summary).toContain("Arena B: games increased");
		expect(view.summary).not.toContain("Philadelphia");
		expect(view.summary).not.toContain("Houston: games");
	});
});

describe("AI subject readiness", () => {
	it("does not start AI while required analytics are absent", () => {
		const heading = { title: "All markets", subtitle: "" };
		expect(
			buildMarketAiSubject({ kind: "all" }, heading, MARKET_SUMMARY, undefined, undefined, "month"),
		).toBeNull();
		expect(
			buildMarketAiSubject(
				{ kind: "all" },
				heading,
				undefined,
				undefined,
				MARKET_PLAYER_STATS,
				"month",
			),
		).toBeNull();
		expect(
			buildMarketAiSubject(
				{ kind: "facility", id: "889", name: "Arena", marketName: "Houston" },
				heading,
				undefined,
				undefined,
				MARKET_PLAYER_STATS,
				"month",
			),
		).toBeNull();
	});
	it("makes a filtered summary its own AI subject and leaves facilities unfiltered", () => {
		const heading = { title: "All markets", subtitle: "" };
		const all = buildMarketAiSubject(
			{ kind: "all" },
			heading,
			MARKET_SUMMARY,
			undefined,
			MARKET_PLAYER_STATS,
			"month",
			["magic", "organizers"],
		);
		const market = buildMarketAiSubject(
			{ kind: "market", id: "houston", name: "Houston" },
			heading,
			MARKET_SUMMARY,
			undefined,
			MARKET_PLAYER_STATS,
			"month",
			["partnerships"],
		);
		const facility = buildMarketAiSubject(
			{ kind: "facility", id: "889", name: "Arena", marketName: "Houston" },
			heading,
			undefined,
			FACILITY_REPORT,
			MARKET_PLAYER_STATS,
			"month",
			["partnerships"],
		);

		expect(all).toMatchObject({
			id: "all~magic+organizers",
			gameDepartments: ["magic", "organizers"],
		});
		expect(market).toMatchObject({ id: "houston~partnerships", gameDepartments: ["partnerships"] });
		expect(facility?.id).toBe("889");
		expect(facility).not.toHaveProperty("gameDepartments");
	});
	it("identifies all markets, one market and one facility", () => {
		const heading = { title: "Houston", subtitle: "" };
		expect(
			buildMarketAiSubject(
				{ kind: "all" },
				heading,
				MARKET_SUMMARY,
				undefined,
				MARKET_PLAYER_STATS,
				"month",
			)?.kind,
		).toBe("all-markets");
		expect(
			buildMarketAiSubject(
				{ kind: "market", id: "houston", name: "Houston" },
				heading,
				MARKET_SUMMARY,
				undefined,
				MARKET_PLAYER_STATS,
				"month",
			)?.kind,
		).toBe("market");
		expect(
			buildMarketAiSubject(
				{ kind: "facility", id: "889", name: "Arena", marketName: "Houston" },
				heading,
				undefined,
				FACILITY_REPORT,
				MARKET_PLAYER_STATS,
				"month",
			)?.kind,
		).toBe("facility");
	});
});

describe("market rows with the per-market comparison", () => {
	const change = (
		id: string,
		played: number,
		playedPrevious: number,
		changePercent: number | null,
	) => ({
		id,
		name: id,
		played,
		playedPrevious,
		change: played - playedPrevious,
		changePercent,
		facilities: [
			{ id: `${id}-a`, name: "A", played, playedPrevious, change: 0, changePercent },
			{ id: `${id}-b`, name: "B", played: 0, playedPrevious: 0, change: 0, changePercent: null },
		],
	});

	it("labels each market's trend and change, and drops markets without games in either period", () => {
		const rows = buildMarketRows(
			[],
			[
				change("down", 40, 50, -20),
				change("up", 60, 50, 20),
				change("flat", 50, 50, 0.2),
				change("new", 10, 0, null),
				change("empty", 0, 0, null),
			],
			messages,
			detailMessages,
			MONTH,
			formatters,
		);
		expect(rows.map((row) => [row.id, row.status, row.changeLabel, row.detail])).toEqual([
			["down", "declining", "\u221220%", "1 of 2 active"],
			["up", "growing", "+20%", "1 of 2 active"],
			["flat", "steady", "0%", "1 of 2 active"],
			["new", "new", "\u2014", "1 of 2 active"],
		]);
		expect(rows[0]?.ariaLabel).toContain("versus the previous 28 days");
		expect(rows[3]?.ariaLabel).toContain("No previous games to compare");
	});

	it("treats a market with no previous games as new even when a percent is present", () => {
		expect(marketTrendStatusOf(change("x", 5, 0, 10))).toBe("new");
		expect(formatChangePercent(-0.4, formatters)).toBe("0%");
	});
});
