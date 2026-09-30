import type { FacilityDetailView, FacilityStatsView } from "@market-health-map/core/application";
import { act, renderHook } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { EN_MESSAGES } from "@/application/test/messages";
import {
	buildDetailViewModel,
	buildSummary,
	buildTiles,
	createDetailFormatters,
	directionOf,
	formatGames,
	resolveDetailStatus,
	useFacilityDetailPanelRules,
} from "@/presentation/components/map/FacilityDetailPanel/FacilityDetailPanelComponent.rules";
import { MessagesProvider } from "@/presentation/components/providers/MessagesProvider/MessagesProviderComponent";

const mockUseFacilityDetail = vi.fn();

vi.mock("@/presentation/hooks/use-facility/use-facility-details", () => ({
	useFacilityDetails: (id: string | null) => mockUseFacilityDetail(id),
}));

const messages = EN_MESSAGES.facilityDetail;
const formatters = createDetailFormatters("en");

const STATS: FacilityStatsView = {
	weekStart: "2026-09-21",
	playedLastWeek: 12,
	playedPreviousWeek: 10,
	playedLast28Days: 41,
	playedPrevious28Days: 0,
	scheduledLast28Days: 0,
	scheduledPrevious28Days: 0,
	uniquePlayersLast28Days: 0,
	uniquePlayersPrevious28Days: 0,
	activatedPlayersLast28Days: 0,
	activatedPlayersPrevious28Days: 0,
	scheduledLastWeek: 16,
	cancelledLastWeek: 4,
	upcomingNextSevenDays: 1,
	lastPlayedDate: "2026-09-27",
	playedChangePercent: 20,
	playedPeriodChangePercent: null,
	cancellationRate: 25,
	confirmationRate: null,
	confirmationRateChangePoints: null,
	uniquePlayersPeriodChangePercent: null,
	activatedPlayersPeriodChangePercent: null,
	weeklyActivity: [],
	popularTimes: [],
};

const DETAIL: FacilityDetailView = {
	facility: {
		id: "889",
		marketId: "houston",
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
	it("summarizes the games played in the last 28 days", () => {
		expect(buildSummary(STATS, messages, formatters)).toBe(
			"41 games played in the last 28 days (Aug 31 – Sep 27, 2026).",
		);
		expect(buildSummary({ ...STATS, playedLast28Days: 1 }, messages, formatters)).toBe(
			"1 game played in the last 28 days (Aug 31 – Sep 27, 2026).",
		);
	});

	it("says when nothing was played", () => {
		expect(buildSummary({ ...STATS, playedLast28Days: 0 }, messages, formatters)).toBe(
			"No games were played here in the last 28 days.",
		);
	});
});

describe("buildTiles", () => {
	it("shows a signed change and the cancellation rate", () => {
		const tiles = buildTiles(STATS, messages, formatters);
		expect(tiles.map((tile) => [tile.key, tile.value, tile.hint, tile.hintDirection])).toEqual([
			["played", "12", "+20% vs previous week", "up"],
			["scheduled", "16", null, "flat"],
			["cancelled", "4", "25% of scheduled", "flat"],
			["upcoming", "1", null, "flat"],
		]);
	});

	it("drops hints without a baseline and keeps the minus sign", () => {
		const empty = buildTiles(
			{ ...STATS, playedChangePercent: null, cancellationRate: null },
			messages,
			formatters,
		);
		expect(empty[0]?.hint).toBeNull();
		expect(empty[2]?.hint).toBeNull();
		const down = buildTiles({ ...STATS, playedChangePercent: -12.5 }, messages, formatters);
		expect(down[0]).toMatchObject({ hint: "-12.5% vs previous week", hintDirection: "down" });
	});
});

describe("buildDetailViewModel", () => {
	it("labels the week and the last game", () => {
		const view = buildDetailViewModel(DETAIL, messages, formatters);
		expect(view).toMatchObject({
			name: "Pegaso HTX",
			address: "1 Main St, Houston, TX",
			avatarUrl: null,
			weekLabel: "Week of Sep 21 – Sep 27, 2026",
			lastPlayedLabel: "Last game played Sep 27, 2026",
		});
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
		mockUseFacilityDetail.mockReturnValue({ data: DETAIL, isPending: false, isError: false });
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
		expect(mockUseFacilityDetail).toHaveBeenCalledWith("889");
		expect(result.current.status).toBe("ready");
		expect(result.current.view?.name).toBe("Pegaso HTX");
		expect(result.current.detail).toBe(DETAIL);
		expect(result.current.messages).toBe(messages);
	});

	it("has no view while loading", () => {
		mockUseFacilityDetail.mockReturnValue({ data: undefined, isPending: true, isError: false });
		const { result } = renderRules();
		expect(result.current.status).toBe("loading");
		expect(result.current.view).toBeNull();
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
