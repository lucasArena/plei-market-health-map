import type {
	ActivityPeriodView,
	FacilityDetailView,
	FacilityStatsView,
} from "@market-health-map/core/application";
import { gamesTrend } from "@market-health-map/core/domain";
import { act, renderHook } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { EN_MESSAGES } from "@/application/test/messages";
import {
	activityPeriodFor,
	buildPopularTimes,
	buildProgressiveDetailViewModel,
	buildProgressiveTiles,
	buildSummary,
	buildWeeklyActivity,
	createDetailFormatters,
	directionOf,
	formatGames,
	formatGamesTrendPanel,
	resolveDetailStatus,
	useFacilityDetailPanelRules,
} from "@/presentation/components/map/FacilityDetailPanel/FacilityDetailPanelComponent.rules";
import {
	MapScopeProvider,
	useMapScope,
} from "@/presentation/components/providers/MapScopeProvider/MapScopeProviderComponent";
import { MessagesProvider } from "@/presentation/components/providers/MessagesProvider/MessagesProviderComponent";

const mockUseFacilityReservationStats = vi.fn();
const mockUseFacilityPlayerStats = vi.fn();

vi.mock("@/presentation/hooks/use-facility/use-facility-reservation-stats", () => ({
	useFacilityReservationStats: (id: string | null) => mockUseFacilityReservationStats(id),
}));

vi.mock("@/presentation/hooks/use-facility/use-facility-player-stats", () => ({
	useFacilityPlayerStats: (id: string | null) => mockUseFacilityPlayerStats(id),
}));

const messages = EN_MESSAGES.facilityDetail;
const MONTH = EN_MESSAGES.statsPeriods.month;
const WEEK = EN_MESSAGES.statsPeriods.week;
const formatters = createDetailFormatters("en");

const STATS: FacilityStatsView = {
	periodStart: "2026-09-03",
	periodEnd: "2026-09-30",
	weekStart: "2026-09-21",
	playedLastWeek: 12,
	playedPreviousWeek: 10,
	playedLast28Days: 41,
	playedPrevious28Days: 34,
	scheduledLast28Days: 50,
	scheduledPrevious28Days: 40,
	uniquePlayersLast28Days: 32,
	uniquePlayersPrevious28Days: 40,
	activatedPlayersLast28Days: 7,
	activatedPlayersPrevious28Days: 5,
	weeklyActivatedPlayers: [],
	uniquePlayersLastWeek: 30,
	uniquePlayersPreviousWeek: 25,
	activatedPlayersLastWeek: 6,
	activatedPlayersPreviousWeek: 5,
	scheduledLastWeek: 16,
	scheduledPreviousWeek: 16,
	cancelledLastWeek: 4,
	cancelledPreviousWeek: 4,
	cancelledLast28Days: 16,
	cancelledPrevious28Days: 16,
	upcomingNextSevenDays: 1,
	lastPlayedDate: "2026-09-27",
	playedChangePercent: 20,
	playedPeriodChangePercent: 20,
	cancellationRate: 25,
	confirmationRate: 82,
	confirmationRateChangePoints: 6,
	uniquePlayersPeriodChangePercent: -4,
	activatedPlayersPeriodChangePercent: 18,
	weeklyActivity: [
		{ weekStart: "2026-08-31", gamesPlayed: 8 },
		{ weekStart: "2026-09-07", gamesPlayed: 11 },
		{ weekStart: "2026-09-14", gamesPlayed: 10 },
		{ weekStart: "2026-09-21", gamesPlayed: 12 },
	],
	popularTimes: [
		{ dayOfWeek: 3, timePeriod: 2, gamesPlayed: 5 },
		{ dayOfWeek: 6, timePeriod: 2, gamesPlayed: 9 },
	],
};

const MONTH_VIEW: ActivityPeriodView = {
	period: "month",
	start: "2026-09-03",
	end: "2026-09-30",
	played: 41,
	playedPrevious: 34,
	playedChangePercent: 20,
	confirmationRate: 82,
	confirmationRatePrevious: 76,
	confirmationRateChangePoints: 6,
	scheduled: 50,
	scheduledPrevious: 45,
	scheduledChangePercent: 11.1,
	cancellationRate: 10,
	cancellationRatePrevious: 12,
	cancellationRateChangePoints: -2,
	uniquePlayers: 32,
	uniquePlayersPrevious: 40,
	uniquePlayersChangePercent: -4,
	activatedPlayers: 7,
	activatedPlayersPrevious: 5,
	activatedPlayersChangePercent: 18,
};

const DETAIL: FacilityDetailView = {
	facility: {
		id: "889",
		marketId: "houston",
		marketName: "Houston",
		name: "Pegaso HTX",
		avatarUrl: null,
		isActive: true,
		isActiveLastWeek: true,
		location: { latitude: 29.7, longitude: -95.4 },
		address: "1 Main St, Houston, TX",
	},
	stats: STATS,
};

function wrapper(props: { children: ReactNode }) {
	const children = createElement(MapScopeProvider, null, props.children);
	return createElement(MessagesProvider, { locale: "en", messages: EN_MESSAGES, children });
}

describe("formatGames", () => {
	it("picks the plural form", () => {
		expect(formatGames(1, messages, formatters)).toBe("1 game");
		expect(formatGames(1200, messages, formatters)).toBe("1,200 games");
	});
});

describe("directionOf", () => {
	it("maps a change to a direction", () => {
		expect(directionOf(5)).toBe("up");
		expect(directionOf(-5)).toBe("down");
		expect(directionOf(0)).toBe("flat");
		expect(directionOf(null)).toBe("flat");
	});
});

describe("activityPeriodFor", () => {
	it("joins the reservation and player numbers of one period", () => {
		expect(activityPeriodFor(STATS, STATS, "week")).toMatchObject({
			period: "week",
			start: "2026-09-21",
			end: "2026-09-27",
			played: 12,
			playedPrevious: 10,
			uniquePlayers: 30,
			activatedPlayers: 6,
		});
		expect(activityPeriodFor(STATS, STATS, "month")).toMatchObject({
			played: 41,
			uniquePlayers: 32,
		});
	});
});

describe("buildSummary", () => {
	it("ranks activation decline ahead of a smaller games decline", () => {
		expect(
			buildSummary(
				{
					...MONTH_VIEW,
					activatedPlayersChangePercent: -29,
					playedChangePercent: -9.9,
					uniquePlayersChangePercent: -11.4,
				},
				messages,
				MONTH,
				formatters,
			),
		).toContain("Activated players: -29%");
		expect(
			buildSummary(
				{
					...MONTH_VIEW,
					activatedPlayersChangePercent: 0,
					playedChangePercent: null,
					uniquePlayersChangePercent: 0,
				},
				messages,
				MONTH,
				formatters,
			),
		).toBe(messages.insightsNone);
	});

	it("says when nothing was played in the selected period", () => {
		expect(buildSummary({ ...MONTH_VIEW, played: 0 }, messages, MONTH, formatters)).toBe(
			"No games were played here in the last 28 days.",
		);
		expect(buildSummary({ ...MONTH_VIEW, played: 0 }, messages, WEEK, formatters)).toBe(
			"No games were played here in the last 7 days.",
		);
	});

	it("names the comparison period", () => {
		expect(
			buildSummary({ ...MONTH_VIEW, confirmationRate: null }, messages, MONTH, formatters),
		).toContain("versus the previous 28 days");
		expect(buildSummary(MONTH_VIEW, messages, WEEK, formatters)).toContain(
			"versus the previous 7 days",
		);
	});
});

describe("buildProgressiveTiles with every metric", () => {
	it("shows the four headline metrics of the period", () => {
		const tiles = buildProgressiveTiles(MONTH_VIEW, MONTH_VIEW, false, messages, formatters);
		expect(
			tiles.map((tile) => [tile.key, tile.label, tile.value, tile.hint, tile.hintDirection]),
		).toEqual([
			["played", "Games played", "41", "+20% vs previous period", "up"],
			["confirmation", "Confirmation rate", "82%", "+6 pts vs previous period", "up"],
			["players", "Unique players", "32", "-4% vs previous period", "down"],
			["activated", "Activated players", "7", "+18% vs previous period", "up"],
		]);
	});

	it("drops hints without a baseline and keeps the minus sign", () => {
		const emptyView = {
			...MONTH_VIEW,
			confirmationRate: null,
			playedChangePercent: null,
			confirmationRateChangePoints: null,
			uniquePlayersChangePercent: null,
			activatedPlayersChangePercent: null,
		};
		const empty = buildProgressiveTiles(emptyView, emptyView, false, messages, formatters);
		expect(empty.every((tile) => tile.hint === null)).toBe(true);
		expect(empty[1]?.value).toBe("Unavailable");
		const downView = {
			...MONTH_VIEW,
			playedChangePercent: -12.5,
			confirmationRateChangePoints: -3.5,
		};
		const down = buildProgressiveTiles(downView, downView, false, messages, formatters);
		expect(down[0]).toMatchObject({
			hint: "-12.5% vs previous period",
			hintDirection: "down",
		});
		expect(down[1]).toMatchObject({
			hint: "-3.5 pts vs previous period",
			hintDirection: "down",
		});
		const flatView = { ...MONTH_VIEW, activatedPlayersChangePercent: 0 };
		const flat = buildProgressiveTiles(flatView, flatView, false, messages, formatters);
		expect(flat[3]).toMatchObject({ hint: "0% vs previous period", hintDirection: "flat" });
	});
});

describe("buildProgressiveTiles", () => {
	it("shows reservation metrics while player metrics load", () => {
		const tiles = buildProgressiveTiles(MONTH_VIEW, undefined, true, messages, formatters);

		expect(tiles.slice(0, 2).map((tile) => tile.value)).toEqual(["41", "82%"]);
		expect(tiles.slice(2).every((tile) => tile.isLoading)).toBe(true);
	});

	it("shows unavailable player metrics after a failed request", () => {
		const tiles = buildProgressiveTiles(MONTH_VIEW, undefined, false, messages, formatters);

		expect(tiles.slice(2).map((tile) => tile.value)).toEqual(["Unavailable", "Unavailable"]);
		expect(tiles.slice(2).every((tile) => !tile.isLoading)).toBe(true);
	});
});

describe("buildWeeklyActivity", () => {
	it("formats each week as a chart point", () => {
		expect(buildWeeklyActivity(STATS, messages, formatters)[0]).toMatchObject({
			key: "2026-08-31",
			shortLabel: "Sep 6",
			value: 8,
			tooltip: "Sep 6: 8 games",
		});
	});

	it("labels each Monday to Sunday week by the Sunday it ends on", () => {
		const points = buildWeeklyActivity(STATS, messages, formatters);

		expect(points.map((point) => point.label)).toEqual(["Sep 6", "Sep 13", "Sep 20", "Sep 27"]);
		expect(points.at(-1)).toMatchObject({ label: "Sep 27", tooltip: "Sep 27: 12 games" });
	});
});

describe("buildPopularTimes", () => {
	it("fills the complete day and time grid", () => {
		const popularTimes = buildPopularTimes(STATS, messages, formatters);
		expect(popularTimes).toHaveLength(28);
		expect(popularTimes.find((cell) => cell.key === "6-2")).toMatchObject({
			value: 9,
			intensity: 4,
			label: "Sat, Evening: 9 games",
			tooltip: "9 games",
		});
		expect(popularTimes.find((cell) => cell.key === "1-0")).toMatchObject({
			value: 0,
			intensity: 0,
		});
	});
});

describe("buildProgressiveDetailViewModel", () => {
	it("labels the last game and shows the selected period", () => {
		const view = buildProgressiveDetailViewModel(
			DETAIL,
			STATS,
			false,
			"month",
			messages,
			MONTH,
			formatters,
		);
		expect(view).toMatchObject({
			name: "Pegaso HTX",
			address: "1 Main St, Houston, TX",
			avatarUrl: null,
			lastPlayedLabel: "Last game played Sep 27, 2026",
		});
		expect(view.tiles[0]?.value).toBe("41");
		expect(view.weeklyActivity).toHaveLength(4);
		expect(view.popularTimes).toHaveLength(28);
		expect(view.summary).toContain("versus the previous 28 days");

		const week = buildProgressiveDetailViewModel(
			DETAIL,
			STATS,
			false,
			"week",
			messages,
			WEEK,
			formatters,
		);
		expect(week.tiles.map((tile) => tile.value)).toEqual(["12", "75%", "30", "6"]);
		expect(week.summary).toContain("versus the previous 7 days");
	});

	it("says when nothing was ever played", () => {
		const view = buildProgressiveDetailViewModel(
			{ ...DETAIL, stats: { ...STATS, lastPlayedDate: null } },
			STATS,
			false,
			"month",
			messages,
			MONTH,
			formatters,
		);
		expect(view.lastPlayedLabel).toBe("No games played yet");
	});

	it("builds charts before the player metrics arrive", () => {
		const view = buildProgressiveDetailViewModel(
			{ facility: DETAIL.facility, stats: STATS },
			undefined,
			true,
			"week",
			messages,
			WEEK,
			formatters,
		);

		expect(view.summary).toBeNull();
		expect(view.weeklyActivity).toHaveLength(4);
		expect(view.popularTimes).toHaveLength(28);
	});
});

describe("resolveDetailStatus", () => {
	it("maps query state to a status", () => {
		expect(resolveDetailStatus(true, false)).toBe("loading");
		expect(resolveDetailStatus(false, true)).toBe("error");
		expect(resolveDetailStatus(false, false)).toBe("ready");
	});
});

describe("useFacilityDetailPanelRules", () => {
	it("formats the games trend only when the map passes one", () => {
		expect(renderRules().result.current.trend).toBeNull();

		const { result } = renderHook(
			() =>
				useFacilityDetailPanelRules({
					facilityId: "889",
					isClosing: false,
					onClose: vi.fn(),
					onClosed: vi.fn(),
					trend: gamesTrend(42, 51),
				}),
			{ wrapper },
		);
		expect(result.current.trend).toEqual({
			level: "down",
			title: "Games trend",
			compare: "42 games now vs 51 in the previous 28 days",
			change: "-18% vs previous 28 days",
		});
	});
	beforeEach(() => {
		vi.clearAllMocks();
		mockUseFacilityReservationStats.mockReturnValue({
			data: { facility: DETAIL.facility, stats: STATS },
			isPending: false,
			isError: false,
		});
		mockUseFacilityPlayerStats.mockReturnValue({
			data: STATS,
			isPending: false,
			isError: false,
		});
	});

	function renderRules(isClosing = false) {
		const onClose = vi.fn();
		const onClosed = vi.fn();
		const rendered = renderHook(
			(props: { isClosing: boolean }) =>
				useFacilityDetailPanelRules({ facilityId: "889", onClose, onClosed, ...props }),
			{ wrapper, initialProps: { isClosing } },
		);
		return { ...rendered, onClose, onClosed };
	}

	it("builds the view for the selected facility", () => {
		const { result } = renderRules();
		expect(mockUseFacilityReservationStats).toHaveBeenCalledWith("889");
		expect(mockUseFacilityPlayerStats).toHaveBeenCalledWith("889");
		expect(result.current.status).toBe("ready");
		expect(result.current.view?.name).toBe("Pegaso HTX");
		expect(result.current.aiContext?.cacheKey).toBe(
			`v10:facility-${DETAIL.facility.id}-week:2026-09-27:en`,
		);
		expect(result.current.view?.tiles[0]?.value).toBe("12");
		expect(result.current.aiContext?.prompt.at(-1)?.content).toContain(DETAIL.facility.name);
		expect(result.current.messages).toBe(messages);
	});

	it("follows the shared period switch", () => {
		const { result } = renderHook(
			() => ({
				rules: useFacilityDetailPanelRules({
					facilityId: "889",
					isClosing: false,
					onClose: vi.fn(),
					onClosed: vi.fn(),
				}),
				scope: useMapScope(),
			}),
			{ wrapper },
		);

		act(() => result.current.scope.setPeriod("month"));

		expect(result.current.rules.view?.tiles[0]?.value).toBe("41");
		expect(result.current.rules.view?.summary).toContain("versus the previous 28 days");
		expect(result.current.rules.aiContext?.cacheKey).toBe("v10:facility-889-month:2026-09-30:en");
	});

	it("has no view while loading", () => {
		mockUseFacilityReservationStats.mockReturnValue({
			data: undefined,
			isPending: true,
			isError: false,
		});
		const { result } = renderRules();
		expect(result.current.status).toBe("loading");
		expect(result.current.view).toBeNull();
	});

	it("shows reservation analytics while player analytics load", () => {
		mockUseFacilityPlayerStats.mockReturnValue({
			data: undefined,
			isPending: true,
			isError: false,
		});
		const { result } = renderRules();

		expect(result.current.status).toBe("ready");
		expect(result.current.view?.weeklyActivity).toHaveLength(4);
		expect(result.current.view?.tiles[2]?.isLoading).toBe(true);
		expect(result.current.aiContext).toBeNull();
		expect(result.current.isAiPending).toBe(true);
	});

	it("closes on Escape only", () => {
		const { onClose, unmount } = renderRules();
		act(() => {
			window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
			window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
		});
		expect(onClose).toHaveBeenCalledTimes(1);
		unmount();
		window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it("reports closed only after the slide-out animation", () => {
		const { result, rerender, onClosed } = renderRules();
		act(() => result.current.handleAnimationEnd());
		expect(onClosed).not.toHaveBeenCalled();
		rerender({ isClosing: true });
		act(() => result.current.handleAnimationEnd());
		expect(onClosed).toHaveBeenCalledTimes(1);
	});
});

describe("formatGamesTrendPanel", () => {
	it("shows current, previous and the signed percent change", () => {
		const trend = EN_MESSAGES.map.trend;
		expect(formatGamesTrendPanel(gamesTrend(46, 40), trend).change).toBe(
			"+15% vs previous 28 days",
		);
		expect(formatGamesTrendPanel(gamesTrend(1, 3), trend).compare).toBe(
			"1 game now vs 3 in the previous 28 days",
		);
		expect(formatGamesTrendPanel(gamesTrend(6, 0), trend).change).toBe(
			"No games in the previous 28 days",
		);
	});
});
