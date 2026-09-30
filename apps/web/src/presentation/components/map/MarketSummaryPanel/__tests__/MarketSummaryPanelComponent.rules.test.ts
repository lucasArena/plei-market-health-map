import { act, renderHook } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { FACILITY_DETAIL } from "@/application/test/facility-detail";
import { MARKET_PLAYER_STATS, MARKET_SUMMARY } from "@/application/test/market-summary";
import { EN_MESSAGES } from "@/application/test/messages";
import { createDetailFormatters } from "@/presentation/components/map/FacilityDetailPanel/FacilityDetailPanelComponent.rules";
import {
	buildFacilityRows,
	buildFacilitySummaryViewModel,
	buildMarketAiSubject,
	buildMarketRows,
	buildMarketSummaryText,
	buildMarketSummaryViewModel,
	buildScopeHeading,
	buildScopeTiles,
	useMarketSummaryPanelRules,
} from "@/presentation/components/map/MarketSummaryPanel/MarketSummaryPanelComponent.rules";
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
let mockScope: MapScope = { kind: "all" };

vi.mock("@/presentation/hooks/use-market/use-market-summary", () => ({
	useMarketSummary: (...args: unknown[]) => mockUseMarketSummary(...args),
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
	useMapScope: () => ({ scope: mockScope, setScope: vi.fn() }),
}));

const IDLE_QUERY = { data: undefined, isPending: true, isError: false };
const {
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
const formatters = createDetailFormatters("en");

function wrapper({ children }: { children: ReactNode }) {
	return createElement(MessagesProvider, { locale: "en", messages: EN_MESSAGES, children });
}

describe("market summary builders", () => {
	it("shows active facilities and markets out of the visible totals", () => {
		expect(buildScopeTiles(MARKET_SUMMARY.scope, messages, formatters)).toEqual([
			{
				key: "facilities",
				label: "Active facilities",
				value: "84",
				hint: "of 142",
				hintDirection: "flat",
				isLoading: false,
			},
			{
				key: "markets",
				label: "Active markets",
				value: "10",
				hint: "of 12",
				hintDirection: "flat",
				isLoading: false,
			},
		]);
	});

	it("writes the network-wide sentence once player analytics arrive", () => {
		expect(
			buildMarketSummaryText(MARKET_SUMMARY, undefined, messages, detailMessages, formatters),
		).toBeNull();
		expect(
			buildMarketSummaryText(
				MARKET_SUMMARY,
				MARKET_PLAYER_STATS,
				messages,
				detailMessages,
				formatters,
			),
		).toBe(
			"Activated players: 20% versus the previous 28 days (20 → 24). Games played: 6% versus the previous 28 days (200 → 212).",
		);
		expect(
			buildMarketSummaryText(
				{ ...MARKET_SUMMARY, stats: { ...MARKET_SUMMARY.stats, playedLast28Days: 0 } },
				MARKET_PLAYER_STATS,
				messages,
				detailMessages,
				formatters,
			),
		).toBe(messages.summaryNone);
	});

	it("ranks markets and facilities with localized game counts", () => {
		expect(
			buildMarketRows(MARKET_SUMMARY.topMarkets, messages, detailMessages, formatters),
		).toEqual([
			{
				key: "houston",
				rank: 1,
				name: "Houston",
				detail: "6 of 9 facilities active",
				value: "120 games",
			},
		]);
		expect(
			buildFacilityRows(MARKET_SUMMARY.topFacilities, detailMessages, formatters).map(
				(row) => `${row.rank}. ${row.name} (${row.detail}): ${row.value}`,
			),
		).toEqual(["1. Pegaso HTX (Houston): 41 games", "2. Phield House (Philadelphia): 1 game"]);
	});

	it("builds the whole view and falls back when nothing was played yet", () => {
		const view = buildMarketSummaryViewModel(
			MARKET_SUMMARY,
			MARKET_PLAYER_STATS,
			false,
			messages,
			detailMessages,
			formatters,
		);
		expect(view.tiles.map((tile) => tile.value)).toEqual(["212", "84.8%", "126", "24"]);
		expect(view.weeklyActivity).toHaveLength(4);
		expect(view.popularTimes).toHaveLength(28);
		expect(view.lastPlayedLabel).toBe("Last game played Sep 27, 2026");

		const empty = buildMarketSummaryViewModel(
			{ ...MARKET_SUMMARY, stats: { ...MARKET_SUMMARY.stats, lastPlayedDate: null } },
			undefined,
			true,
			messages,
			detailMessages,
			formatters,
		);
		expect(empty.lastPlayedLabel).toBe(detailMessages.neverPlayed);
		expect(empty.tiles[2]?.isLoading).toBe(true);
		expect(view.topMarkets).toHaveLength(1);
		expect(view.scopeTiles).toHaveLength(2);
	});

	it("drops the markets tile and ranking when scoped to one market", () => {
		const view = buildMarketSummaryViewModel(
			{ ...MARKET_SUMMARY, stats: { ...MARKET_SUMMARY.stats, playedLast28Days: 0 } },
			MARKET_PLAYER_STATS,
			false,
			messages,
			detailMessages,
			formatters,
			true,
		);

		expect(view.topMarkets).toBeNull();
		expect(view.topFacilities).toHaveLength(2);
		expect(view.scopeTiles).toEqual([]);
		expect(view.summary).toBe(messages.marketSummaryNone);
	});

	it("builds a facility view without scope tiles or rankings", () => {
		const view = buildFacilitySummaryViewModel(
			FACILITY_RESERVATION_STATS,
			MARKET_PLAYER_STATS,
			false,
			detailMessages,
			formatters,
		);

		expect(view.scopeTiles).toEqual([]);
		expect(view.topMarkets).toBeNull();
		expect(view.topFacilities).toBeNull();
		expect(view.summary).toContain("Games played: 6%");
		expect(view.popularTimes).toHaveLength(28);
		expect(
			buildFacilitySummaryViewModel(
				FACILITY_RESERVATION_STATS,
				undefined,
				true,
				detailMessages,
				formatters,
			).summary,
		).toBeNull();
	});

	it("titles the drawer after its scope", () => {
		expect(buildScopeHeading({ kind: "all" }, messages)).toEqual({
			title: "All markets",
			subtitle: messages.subtitle,
		});
		expect(buildScopeHeading({ kind: "market", id: "houston", name: "Houston" }, messages)).toEqual(
			{ title: "Houston", subtitle: "Market summary, last 28 days" },
		);
		expect(
			buildScopeHeading(
				{ kind: "facility", id: "889", name: "Pegaso HTX", marketName: "Houston" },
				messages,
			),
		).toEqual({ title: "Pegaso HTX", subtitle: "Facility in Houston, last 28 days" });
	});
});

describe("useMarketSummaryPanelRules", () => {
	beforeEach(() => {
		mockScope = { kind: "all" };
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
	});

	function renderRules(isClosing = false) {
		const onClose = vi.fn();
		const onClosed = vi.fn();
		const rendered = renderHook(
			(props: { isClosing: boolean }) =>
				useMarketSummaryPanelRules({ onClose, onClosed, ...props }),
			{ wrapper, initialProps: { isClosing } },
		);
		return { ...rendered, onClose, onClosed };
	}

	it("keeps the card ready while insights are pending or fail", () => {
		mockUseMarketGameInsights.mockReturnValue(IDLE_QUERY);
		const { result, rerender } = renderRules();
		expect(result.current.status).toBe("ready");
		expect(result.current.view?.tiles).toHaveLength(4);
		expect(result.current.view?.weeklyActivity.length).toBeGreaterThan(0);
		expect(result.current.view?.summary).toBeNull();
		expect(result.current.isSummaryPending).toBe(true);
		mockUseMarketGameInsights.mockReturnValue({ data: undefined, isPending: false, isError: true });
		rerender({ isClosing: false });
		expect(result.current.status).toBe("ready");
		expect(result.current.isInsightsFailed).toBe(true);
		expect(result.current.view?.tiles).toHaveLength(4);
	});
	it("defers insights until the main report arrives and disables them for facility scope", () => {
		mockUseMarketSummary.mockReturnValue(IDLE_QUERY);
		const { rerender } = renderRules();
		expect(mockUseMarketGameInsights).toHaveBeenLastCalledWith(null, false);
		mockUseMarketSummary.mockReturnValue({
			data: MARKET_SUMMARY,
			isPending: false,
			isError: false,
		});
		rerender({ isClosing: false });
		expect(mockUseMarketGameInsights).toHaveBeenLastCalledWith(null, true);
		mockScope = { kind: "facility", id: "889", name: "Pegaso HTX", marketName: "Houston" };
		rerender({ isClosing: false });
		expect(mockUseMarketGameInsights).toHaveBeenLastCalledWith(null, false);
	});
	it("builds the market-wide view", () => {
		const { result } = renderRules();

		expect(result.current.status).toBe("ready");
		expect(result.current.view?.scopeTiles).toHaveLength(2);
		expect(result.current.view?.summary).toContain("Activated players: 20%");
		expect(result.current.isSummaryPending).toBe(false);
		expect(result.current.messages).toBe(messages);
		expect(result.current.heading.title).toBe("All markets");
		expect(mockUseMarketSummary).toHaveBeenLastCalledWith(null, true);
		expect(mockUseMarketPlayerStats).toHaveBeenLastCalledWith(null, true);
		expect(mockUseFacilityReservationStats).toHaveBeenLastCalledWith(null);
	});

	it("follows a market scope and updates when the filter changes while open", () => {
		const { result, rerender } = renderRules();

		mockScope = { kind: "market", id: "houston", name: "Houston" };
		rerender({ isClosing: false });

		expect(mockUseMarketSummary).toHaveBeenLastCalledWith("houston", true);
		expect(mockUseMarketPlayerStats).toHaveBeenLastCalledWith("houston", true);
		expect(result.current.heading.title).toBe("Houston");
		expect(result.current.view?.topMarkets).toBeNull();
		expect(result.current.view?.scopeTiles).toHaveLength(0);
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

		expect(mockUseMarketSummary).toHaveBeenLastCalledWith(null, false);
		expect(mockUseMarketPlayerStats).toHaveBeenLastCalledWith(null, false);
		expect(mockUseFacilityReservationStats).toHaveBeenLastCalledWith("889");
		expect(mockUseFacilityPlayerStats).toHaveBeenLastCalledWith("889");
		expect(result.current.status).toBe("ready");
		expect(result.current.heading).toEqual({
			title: "Pegaso HTX",
			subtitle: "Facility in Houston, last 28 days",
		});
		expect(result.current.view?.topFacilities).toBeNull();
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
				playedLast28Days: 100,
				playedPrevious28Days: 200,
				change: -100,
				changePercent: -50,
				facilities: [
					{
						id: "1",
						name: "Arena A",
						playedLast28Days: 20,
						playedPrevious28Days: 140,
						change: -120,
						changePercent: -85.7,
					},
					{
						id: "2",
						name: "Arena B",
						playedLast28Days: 80,
						playedPrevious28Days: 60,
						change: 20,
						changePercent: 33.3,
					},
				],
			},
			{
				id: "philly",
				name: "Philadelphia",
				playedLast28Days: 80,
				playedPrevious28Days: 0,
				change: 80,
				changePercent: null,
				facilities: [],
			},
		],
	};
	it("names markets and their contributions without facilities in all-markets scope", () => {
		const text = buildMarketSummaryText(summary, undefined, messages, detailMessages, formatters);
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
			messages,
			detailMessages,
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
			buildMarketAiSubject({ kind: "all" }, heading, MARKET_SUMMARY, undefined, undefined),
		).toBeNull();
		expect(
			buildMarketAiSubject({ kind: "all" }, heading, undefined, undefined, MARKET_PLAYER_STATS),
		).toBeNull();
		expect(
			buildMarketAiSubject(
				{ kind: "facility", id: "889", name: "Arena", marketName: "Houston" },
				heading,
				undefined,
				undefined,
				MARKET_PLAYER_STATS,
			),
		).toBeNull();
	});
	it("identifies all markets, one market and one facility", () => {
		const heading = { title: "Houston", subtitle: "" };
		expect(
			buildMarketAiSubject({ kind: "all" }, heading, MARKET_SUMMARY, undefined, MARKET_PLAYER_STATS)
				?.kind,
		).toBe("all-markets");
		expect(
			buildMarketAiSubject(
				{ kind: "market", id: "houston", name: "Houston" },
				heading,
				MARKET_SUMMARY,
				undefined,
				MARKET_PLAYER_STATS,
			)?.kind,
		).toBe("market");
		expect(
			buildMarketAiSubject(
				{ kind: "facility", id: "889", name: "Arena", marketName: "Houston" },
				heading,
				undefined,
				FACILITY_REPORT,
				MARKET_PLAYER_STATS,
			)?.kind,
		).toBe("facility");
	});
});
