import type { FacilityDetailView, FacilityStatsView } from "@market-health-map/core/application";
import { act, renderHook } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { EN_MESSAGES } from "@/application/test/messages";
import {
	buildDetailViewModel,
	buildPopularTimes,
	buildProgressiveDetailViewModel,
	buildProgressiveTiles,
	buildSummary,
	buildTiles,
	buildWeeklyActivity,
	createDetailFormatters,
	directionOf,
	formatGames,
	resolveDetailStatus,
	useFacilityDetailPanelRules,
} from "@/presentation/components/map/FacilityDetailPanel/FacilityDetailPanelComponent.rules";
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
const formatters = createDetailFormatters("en");

const STATS: FacilityStatsView = {
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
	scheduledLastWeek: 16,
	cancelledLastWeek: 4,
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

const DETAIL: FacilityDetailView = {
	facility: {
		id: "889",
		marketId: "houston",
		marketName: "Houston",
		name: "Pegaso HTX",
		avatarUrl: null,
		isActive: true,
		location: { latitude: 29.7, longitude: -95.4 },
		address: "1 Main St, Houston, TX",
	},
	stats: STATS,
};

function wrapper({ children }: { children: ReactNode }) {
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

describe("buildSummary", () => {
	it("summarizes high-level facility activity", () => {
		expect(buildSummary(STATS, messages, formatters)).toBe(
			"41 games brought in 7 newly activated players, with a confirmation rate of 82%. Activity was strongest on Sat PM.",
		);
		expect(buildSummary({ ...STATS, playedLast28Days: 1 }, messages, formatters)).toBe(
			"1 game brought in 7 newly activated players, with a confirmation rate of 82%. Activity was strongest on Sat PM.",
		);
	});

	it("says when nothing was played", () => {
		expect(buildSummary({ ...STATS, playedLast28Days: 0 }, messages, formatters)).toBe(
			"No games were played here in the last 28 days.",
		);
	});

	it("handles missing rates and labels in the deterministic fallback", () => {
		const summary = buildSummary(
			{
				...STATS,
				confirmationRate: null,
				popularTimes: [{ dayOfWeek: 9, timePeriod: 9, gamesPlayed: 12 }],
			},
			{ ...messages, dayLabels: [], timePeriodLabels: [] },
			formatters,
		);
		expect(summary).toContain("confirmation rate of Unavailable");
	});
});

describe("buildTiles", () => {
	it("shows the four 28-day headline metrics", () => {
		const tiles = buildTiles(STATS, messages, formatters);
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
		const empty = buildTiles(
			{
				...STATS,
				confirmationRate: null,
				playedPeriodChangePercent: null,
				confirmationRateChangePoints: null,
				uniquePlayersPeriodChangePercent: null,
				activatedPlayersPeriodChangePercent: null,
			},
			messages,
			formatters,
		);
		expect(empty.every((tile) => tile.hint === null)).toBe(true);
		expect(empty[1]?.value).toBe("Unavailable");
		const down = buildTiles(
			{ ...STATS, playedPeriodChangePercent: -12.5, confirmationRateChangePoints: -3.5 },
			messages,
			formatters,
		);
		expect(down[0]).toMatchObject({
			hint: "-12.5% vs previous period",
			hintDirection: "down",
		});
		expect(down[1]).toMatchObject({
			hint: "-3.5 pts vs previous period",
			hintDirection: "down",
		});
		const flat = buildTiles(
			{ ...STATS, activatedPlayersPeriodChangePercent: 0 },
			messages,
			formatters,
		);
		expect(flat[3]).toMatchObject({ hint: "0% vs previous period", hintDirection: "flat" });
	});
});

describe("buildProgressiveTiles", () => {
	it("shows reservation metrics while player metrics load", () => {
		const tiles = buildProgressiveTiles(STATS, undefined, true, messages, formatters);

		expect(tiles.slice(0, 2).map((tile) => tile.value)).toEqual(["41", "82%"]);
		expect(tiles.slice(2).every((tile) => tile.isLoading)).toBe(true);
	});

	it("shows unavailable player metrics after a failed request", () => {
		const tiles = buildProgressiveTiles(STATS, undefined, false, messages, formatters);

		expect(tiles.slice(2).map((tile) => tile.value)).toEqual(["Unavailable", "Unavailable"]);
		expect(tiles.slice(2).every((tile) => !tile.isLoading)).toBe(true);
	});
});

describe("buildWeeklyActivity", () => {
	it("formats each week as a chart point", () => {
		expect(buildWeeklyActivity(STATS, messages, formatters)[0]).toMatchObject({
			shortLabel: "Aug 31",
			value: 8,
			tooltip: "Aug 31: 8 games",
		});
	});
});

describe("buildPopularTimes", () => {
	it("fills the complete day and time grid", () => {
		const popularTimes = buildPopularTimes(STATS, messages, formatters);
		expect(popularTimes).toHaveLength(28);
		expect(popularTimes.find((cell) => cell.key === "6-2")).toMatchObject({
			value: 9,
			intensity: 4,
			tooltip: "Sat, PM: 9 games",
		});
		expect(popularTimes.find((cell) => cell.key === "1-0")).toMatchObject({
			value: 0,
			intensity: 0,
		});
	});
});

describe("buildDetailViewModel", () => {
	it("labels the last game", () => {
		const view = buildDetailViewModel(DETAIL, messages, formatters);
		expect(view).toMatchObject({
			name: "Pegaso HTX",
			address: "1 Main St, Houston, TX",
			avatarUrl: null,
			lastPlayedLabel: "Last game played Sep 27, 2026",
		});
		expect(view.tiles).toHaveLength(4);
		expect(view.weeklyActivity).toHaveLength(4);
		expect(view.popularTimes).toHaveLength(28);
	});

	it("says when nothing was ever played", () => {
		const view = buildDetailViewModel(
			{ ...DETAIL, stats: { ...STATS, lastPlayedDate: null } },
			messages,
			formatters,
		);
		expect(view.lastPlayedLabel).toBe("No games played yet");
	});
});

describe("buildProgressiveDetailViewModel", () => {
	it("builds charts before the player metrics arrive", () => {
		const view = buildProgressiveDetailViewModel(
			{ facility: DETAIL.facility, stats: STATS },
			undefined,
			true,
			messages,
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
			`v4:facility-${DETAIL.facility.id}:${DETAIL.stats.weekStart}:en`,
		);
		expect(result.current.aiContext?.prompt.at(-1)?.content).toContain(DETAIL.facility.name);
		expect(result.current.messages).toBe(messages);
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
