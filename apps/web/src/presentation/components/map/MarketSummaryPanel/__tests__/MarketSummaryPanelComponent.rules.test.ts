import { act, renderHook } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { MARKET_PLAYER_STATS, MARKET_SUMMARY } from "@/application/test/market-summary";
import { EN_MESSAGES } from "@/application/test/messages";
import { createDetailFormatters } from "@/presentation/components/map/FacilityDetailPanel/FacilityDetailPanelComponent.rules";
import {
	buildFacilityRows,
	buildMarketRows,
	buildMarketSummaryText,
	buildMarketSummaryViewModel,
	buildScopeTiles,
	useMarketSummaryPanelRules,
} from "@/presentation/components/map/MarketSummaryPanel/MarketSummaryPanelComponent.rules";
import { MessagesProvider } from "@/presentation/components/providers/MessagesProvider/MessagesProviderComponent";

const mockUseMarketSummary = vi.fn();
const mockUseMarketPlayerStats = vi.fn();

vi.mock("@/presentation/hooks/use-market/use-market-summary", () => ({
	useMarketSummary: () => mockUseMarketSummary(),
}));

vi.mock("@/presentation/hooks/use-market/use-market-player-stats", () => ({
	useMarketPlayerStats: () => mockUseMarketPlayerStats(),
}));

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
			"212 games across 84 active facilities brought in 24 newly activated players, with a confirmation rate of 84.8%. Activity was strongest on Sat PM.",
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
	});
});

describe("useMarketSummaryPanelRules", () => {
	beforeEach(() => {
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

	it("builds the market-wide view", () => {
		const { result } = renderRules();

		expect(result.current.status).toBe("ready");
		expect(result.current.view?.scopeTiles).toHaveLength(2);
		expect(result.current.view?.summary).toContain("84 active facilities");
		expect(result.current.isSummaryPending).toBe(false);
		expect(result.current.messages).toBe(messages);
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
