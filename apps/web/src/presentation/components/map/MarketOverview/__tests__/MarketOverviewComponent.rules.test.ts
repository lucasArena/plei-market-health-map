import type { ReservationPeriodView, StatsPeriod } from "@market-health-map/core/application";
import { act, renderHook } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { MARKET_SUMMARY } from "@/application/test/market-summary";
import { EN_MESSAGES } from "@/application/test/messages";
import { createDetailFormatters } from "@/presentation/components/map/FacilityDetailPanel/FacilityDetailPanelComponent.rules";
import {
	buildFacilitiesActive,
	buildMarketScorecards,
	buildMarketStatus,
	buildMarketTrend,
	marketDrivers,
	useMarketOverviewRules,
	weekStreak,
} from "@/presentation/components/map/MarketOverview/MarketOverviewComponent.rules";
import { MessagesProvider } from "@/presentation/components/providers/MessagesProvider/MessagesProviderComponent";

const mockSetScope = vi.fn();
const mockSetPeriod = vi.fn();
let mockPeriod: StatsPeriod = "month";
const mockUseMarketSummary = vi.fn();
const mockUseMarketGameInsights = vi.fn();

vi.mock("@/presentation/components/providers/MapScopeProvider/MapScopeProviderComponent", () => ({
	useMapScope: () => ({ period: mockPeriod, setPeriod: mockSetPeriod, setScope: mockSetScope }),
}));
vi.mock("@/presentation/hooks/use-market/use-market-summary", () => ({
	useMarketSummary: (...args: unknown[]) => mockUseMarketSummary(...args),
}));
vi.mock("@/presentation/hooks/use-market/use-market-game-insights", () => ({
	useMarketGameInsights: (...args: unknown[]) => mockUseMarketGameInsights(...args),
}));
vi.mock("@/presentation/hooks/use-market/use-market-summary-filters", () => ({
	useMarketSummaryFilters: () => ({ departments: ["magic"] }),
}));

const messages = EN_MESSAGES.marketView;
const summaryMessages = EN_MESSAGES.marketSummary;
const monthMessages = EN_MESSAGES.statsPeriods.month;
const formatters = createDetailFormatters("en");

function games(overrides: Partial<ReservationPeriodView> = {}): ReservationPeriodView {
	return {
		period: "month",
		start: "2026-09-09",
		end: "2026-10-06",
		played: 48,
		playedPrevious: 60,
		playedChangePercent: -20,
		confirmationRate: 75,
		confirmationRatePrevious: 83,
		confirmationRateChangePoints: -8,
		scheduled: 64,
		scheduledPrevious: 72,
		scheduledChangePercent: -11,
		cancellationRate: 11,
		cancellationRatePrevious: 6,
		cancellationRateChangePoints: 5,
		...overrides,
	};
}

function facility(id: string, playedPrevious: number, played: number) {
	const change = played - playedPrevious;
	return { id, name: `Facility ${id}`, played, playedPrevious, change, changePercent: null };
}

const WEEKS = [16, 15, 15, 14, 14, 13, 11, 10];

describe("market overview rules", () => {
	it("counts the run of weekly moves in the same direction ending last week", () => {
		expect(weekStreak(WEEKS)).toEqual({ weeks: 3, direction: "down" });
		expect(weekStreak([1, 2, 3])).toEqual({ weeks: 2, direction: "up" });
		expect(weekStreak([3, 3])).toEqual({ weeks: 0, direction: "flat" });
		expect(weekStreak([5])).toEqual({ weeks: 0, direction: "flat" });
	});

	it("names the facilities behind most of the change, at most three", () => {
		const facilities = [
			facility("a", 14, 8),
			facility("b", 11, 6),
			facility("c", 3, 5),
			facility("d", 4, 3),
		];

		expect(marketDrivers(facilities, -12)).toMatchObject({
			share: 11,
			total: 12,
			facilities: [{ id: "a" }, { id: "b" }],
		});
		expect(marketDrivers(facilities, 0)).toBeNull();
		expect(marketDrivers([facility("c", 3, 5)], -2)).toBeNull();
		expect(
			marketDrivers(
				[facility("a", 2, 1), facility("b", 2, 1), facility("c", 2, 1), facility("d", 2, 1)],
				-4,
			)?.facilities,
		).toHaveLength(3);
	});

	it("flags a falling market with its streak and the facilities driving it", () => {
		const status = buildMarketStatus(
			"Miami Metro",
			games(),
			WEEKS,
			[facility("Pegaso", 14, 8), facility("Doral", 11, 6), facility("Kendall", 3, 5)],
			messages,
			monthMessages,
			"en",
			formatters,
		);

		expect(status).toEqual({
			tone: "attention",
			label: "Needs attention",
			headline: "Miami Metro: down 3 weeks in a row, driven by 2 facilities.",
			detail:
				"11 of the 12 games lost (60 → 48) came from Facility Pegaso (14 → 8) and Facility Doral (11 → 6).",
		});
	});

	it("describes growth, offsetting drivers and steady markets", () => {
		const growing = games({ played: 60, playedPrevious: 48, playedChangePercent: 25 });
		const status = buildMarketStatus(
			"Austin",
			growing,
			[10, 12, 11],
			[facility("a", 2, 20)],
			messages,
			monthMessages,
			"en",
			formatters,
		);

		expect(status.tone).toBe("growing");
		expect(status.headline).toBe(
			"Austin: games up 25% vs the previous 28 days, driven by 1 facility.",
		);
		expect(status.detail).toBe(
			"Facility a (2 → 20) gained 18 games, while the market gained 12 overall (48 → 60).",
		);

		const steady = buildMarketStatus(
			"Denver",
			games({ played: 50, playedPrevious: 51, playedChangePercent: -2 }),
			[5, 4],
			[facility("a", 20, 10)],
			messages,
			monthMessages,
			"en",
			formatters,
		);
		expect(steady).toMatchObject({
			tone: "onTrack",
			label: "On track",
			headline: "Denver: games steady vs the previous 28 days.",
			detail: null,
		});

		const lostOffset = buildMarketStatus(
			"Tampa",
			games(),
			[3, 4],
			[facility("a", 30, 10)],
			messages,
			monthMessages,
			"en",
			formatters,
		);
		expect(lostOffset.headline).toBe(
			"Tampa: games down 20% vs the previous 28 days, driven by 1 facility.",
		);
		expect(lostOffset.detail).toBe(
			"Facility a (30 → 10) lost 20 games, while the market lost 12 overall (60 → 48).",
		);

		const gainedShare = buildMarketStatus(
			"Reno",
			games({ played: 70, playedPrevious: 50, playedChangePercent: 40 }),
			[4, 6],
			[facility("a", 10, 25)],
			messages,
			monthMessages,
			"en",
			formatters,
		);
		expect(gainedShare.detail).toBe(
			"15 of the 20 games gained (50 → 70) came from Facility a (10 → 25).",
		);
		expect(
			buildMarketStatus(
				"X",
				games(),
				[1, 2, 3],
				undefined,
				messages,
				monthMessages,
				"en",
				formatters,
			).headline,
		).toBe("X: up 2 weeks in a row.");
	});

	it("builds the scorecards with good and bad changes", () => {
		const cards = buildMarketScorecards(
			games(),
			messages,
			summaryMessages,
			monthMessages,
			formatters,
		);

		expect(cards.played).toMatchObject({
			label: "Games played",
			aside: "Main metric",
			value: "48",
			change: { label: "−20%", tone: "bad" },
			caption: "vs 60 in the previous 28 days",
		});
		expect(cards.confirmation).toMatchObject({
			value: "75%",
			change: { label: "−8 pts vs previous period", tone: "bad" },
		});
		expect(cards.cancellation).toMatchObject({
			value: "11%",
			change: { label: "+5 pts vs previous period", tone: "bad" },
		});

		const empty = buildMarketScorecards(
			games({
				playedChangePercent: null,
				confirmationRate: null,
				confirmationRateChangePoints: null,
			}),
			messages,
			summaryMessages,
			monthMessages,
			formatters,
		);
		expect(empty.played.change).toBeNull();
		expect(empty.confirmation).toMatchObject({ value: "—", change: null });
	});

	it("colors this period's bars by their weekly run and labels both periods", () => {
		const stats = {
			...MARKET_SUMMARY.stats,
			weeklyActivity: WEEKS.map((gamesPlayed, index) => ({
				weekStart: `2026-08-${String(10 + index * 7 > 31 ? 9 : 10 + index).padStart(2, "0")}`,
				gamesPlayed,
			})),
		};

		const trend = buildMarketTrend(stats, games(), "month", messages, formatters);

		expect(trend.caption).toEqual({
			direction: "down",
			label: "Down 3 weeks in a row",
			sequence: "14 → 13 → 11 → 10",
		});
		expect(trend.points.map((point) => point.tone)).toEqual([
			"previous",
			"previous",
			"previous",
			"previous",
			"flat",
			"down1",
			"down2",
			"down3",
		]);
		expect(trend.points[7]?.isLatest).toBe(true);
		expect(trend.groups.map((group) => [group.label, group.weeks])).toEqual([
			["Previous 28 days · 60", 4],
			["This period · 48", 4],
		]);

		const week = buildMarketTrend(
			{
				...stats,
				weeklyActivity: stats.weeklyActivity.map((item, i) => ({ ...item, gamesPlayed: i })),
			},
			games(),
			"week",
			messages,
			formatters,
		);
		expect(week.groups).toEqual([]);
		expect(week.caption?.label).toBe("Up 7 weeks in a row");
		expect(week.points.slice(-2).map((point) => point.tone)).toEqual(["previous", "up3"]);

		const flat = buildMarketTrend(
			{
				...stats,
				weeklyActivity: stats.weeklyActivity
					.slice(0, 2)
					.map((item) => ({ ...item, gamesPlayed: 4 })),
			},
			games(),
			"month",
			messages,
			formatters,
		);
		expect(flat.caption).toMatchObject({ label: "Flat vs last week", sequence: "4 → 4" });
		expect(
			buildMarketTrend(
				{ ...stats, weeklyActivity: [{ weekStart: "2026-10-01", gamesPlayed: 1 }] },
				games(),
				"month",
				messages,
				formatters,
			).caption,
		).toBeNull();
		const lastWeek = buildMarketTrend(
			{
				...stats,
				weeklyActivity: [3, 5, 4].map((value, index) => ({
					weekStart: `2026-09-0${index + 1}`,
					gamesPlayed: value,
				})),
			},
			games(),
			"month",
			messages,
			formatters,
		);
		expect(lastWeek.caption).toMatchObject({
			direction: "down",
			label: "Down vs last week",
			sequence: "5 → 4",
		});
	});

	it("counts active facilities in the market", () => {
		expect(
			buildFacilitiesActive(
				{ facilityCount: 14, activeFacilityCount: 11, marketCount: 1, activeMarketCount: 1 },
				summaryMessages,
				formatters,
			),
		).toBe("11 of 14 facilities active");
		expect(buildFacilitiesActive(undefined, summaryMessages, formatters)).toBeNull();
	});
});

function wrapper({ children }: { children: ReactNode }) {
	return createElement(MessagesProvider, { locale: "en", messages: EN_MESSAGES, children });
}

describe("useMarketOverviewRules", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockPeriod = "month";
	});

	it("loads the market with the Layers filter and builds the overview", () => {
		mockUseMarketSummary.mockReturnValue({ data: MARKET_SUMMARY });
		mockUseMarketGameInsights.mockReturnValue({
			data: [{ id: "miami", facilities: [facility("a", 10, 1)] }],
		});

		const { result } = renderHook(
			() => useMarketOverviewRules({ marketId: "miami", marketName: "Miami Metro" }),
			{ wrapper },
		);

		expect(mockUseMarketSummary).toHaveBeenCalledWith("miami", true, ["magic"]);
		expect(mockUseMarketGameInsights).toHaveBeenCalledWith("miami", "month", true, ["magic"]);
		expect(result.current.header).toMatchObject({
			title: "Miami Metro",
			level: "Market",
			facilitiesActive: "84 of 142 facilities active",
		});
		expect(result.current.sections?.scorecards.played.label).toBe("Games played");
		expect(result.current.scorecardsTitle).toBe("Scorecards");

		act(() => result.current.header.breadcrumb[0]?.onSelect?.());
		expect(mockSetScope).toHaveBeenCalledWith({ kind: "all" });
		act(() => result.current.setPeriod("week"));
		expect(mockSetPeriod).toHaveBeenCalledWith("week");
	});

	it("waits for the summary before building sections", () => {
		mockUseMarketSummary.mockReturnValue({ data: undefined });
		mockUseMarketGameInsights.mockReturnValue({ data: undefined });

		const { result } = renderHook(
			() => useMarketOverviewRules({ marketId: "miami", marketName: "Miami Metro" }),
			{ wrapper },
		);

		expect(mockUseMarketGameInsights).toHaveBeenCalledWith("miami", "month", false, ["magic"]);
		expect(result.current.sections).toBeNull();
		expect(result.current.header.facilitiesActive).toBeNull();
	});
});
