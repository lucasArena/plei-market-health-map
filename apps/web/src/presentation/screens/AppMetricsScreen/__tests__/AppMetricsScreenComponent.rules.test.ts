import type { AppMetricsPeoplePage, AppMetricsView } from "@market-health-map/core/application";
import { act, renderHook } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { EN_MESSAGES } from "@/application/test/messages";
import { createDetailFormatters } from "@/presentation/components/map/FacilityDetailPanel/FacilityDetailPanelComponent.rules";
import { MessagesProvider } from "@/presentation/components/providers/MessagesProvider/MessagesProviderComponent";
import {
	buildMetricTiles,
	buildPeopleRows,
	buildWeeklyPoints,
	featureLabel,
	goalDirection,
	useAppMetricsScreenRules,
} from "@/presentation/screens/AppMetricsScreen/AppMetricsScreenComponent.rules";

const mockMetrics = vi.fn();
const mockPeople = vi.fn();

vi.mock("@/presentation/hooks/use-metrics/use-app-metrics", () => ({
	useAppMetrics: () => mockMetrics(),
}));
vi.mock("@/presentation/hooks/use-metrics/use-app-metrics-people", () => ({
	useAppMetricsPeople: (page: number) => mockPeople(page),
}));

const messages = EN_MESSAGES.appMetrics;
const formatters = createDetailFormatters("en");

const METRICS: AppMetricsView = {
	weekStart: "2026-09-28",
	weekEnd: "2026-10-04",
	goalPercent: 75,
	targetCount: 11,
	activeTargetCount: 9,
	targetPercent: 81.8,
	isGoalMet: true,
	activeUserCount: 14,
	inactiveTargets: ["blake@plei.com", "bruno@plei.com"],
	weeks: [
		{ weekStart: "2026-09-21", activeTargetCount: 6, targetPercent: 54.5, activeUserCount: 10 },
		{ weekStart: "2026-09-28", activeTargetCount: 9, targetPercent: 81.8, activeUserCount: 14 },
	],
};

const PEOPLE: AppMetricsPeoplePage = {
	rows: [
		{
			email: "stefano@plei.com",
			name: "Stefano Sanchez",
			isTarget: true,
			daysActive: 4,
			visits: 9,
			minutes: 73,
			topFeature: "marketSummariesOpened",
			lastSeenAt: "2026-09-30T15:00:00.000Z",
		},
		{
			email: "blake@plei.com",
			name: null,
			isTarget: true,
			daysActive: 0,
			visits: 0,
			minutes: 0,
			topFeature: null,
			lastSeenAt: null,
		},
	],
	page: 1,
	pageSize: 10,
	total: 12,
	pageCount: 2,
};

function wrapper({ children }: { children: ReactNode }) {
	return createElement(MessagesProvider, { locale: "en", messages: EN_MESSAGES, children });
}

describe("app metrics view models", () => {
	it("shows the weekly goal as green when met, red when missed and neutral without targets", () => {
		const tiles = buildMetricTiles(METRICS, messages, formatters);

		expect(tiles.map((tile) => [tile.key, tile.value, tile.hint, tile.hintDirection])).toEqual([
			["goal", "81.8%", "9 of 11 target users · goal 75%", "up"],
			["active", "14", "Everyone who opened the app", "flat"],
			["not-yet", "2", null, "flat"],
		]);
		expect(goalDirection({ ...METRICS, isGoalMet: false })).toBe("down");
		expect(goalDirection({ ...METRICS, targetCount: 0, isGoalMet: false })).toBe("flat");
		expect(
			buildMetricTiles({ ...METRICS, inactiveTargets: [] }, messages, formatters)[2]?.hint,
		).toBe("Everyone has used it this week");
	});

	it("turns each week into an all-users point and a target-users point", () => {
		const weekly = buildWeeklyPoints(METRICS, messages, formatters);

		expect(weekly.all).toEqual([
			expect.objectContaining({
				key: "2026-09-21",
				shortLabel: "Sep 21",
				value: 10,
				tooltip: "Week of Sep 21: 10 people active",
			}),
			expect.objectContaining({ key: "2026-09-28", value: 14 }),
		]);
		expect(weekly.targets).toEqual([
			expect.objectContaining({
				key: "2026-09-21",
				value: 6,
				valueLabel: "6",
				tooltip: "Week of Sep 21: 6 of 11 target users (54.5%)",
			}),
			expect.objectContaining({ key: "2026-09-28", value: 9 }),
		]);
	});

	it("formats each person, falling back to the email and 'Not yet'", () => {
		const [stefano, blake] = buildPeopleRows(PEOPLE, messages, formatters);

		expect(stefano).toEqual({
			key: "stefano@plei.com",
			name: "Stefano Sanchez",
			email: "stefano@plei.com",
			isTarget: true,
			days: "4",
			visits: "9",
			minutes: "73",
			topFeature: "Market summary",
			lastSeen: "Sep 30, 2026",
		});
		expect(blake).toMatchObject({
			name: "blake@plei.com",
			email: null,
			topFeature: "—",
			lastSeen: "Not yet",
		});
		expect(
			["facilitiesOpened", "searches", "aiSummaries", "feedbackSent"].map((feature) =>
				featureLabel(feature as never, messages),
			),
		).toEqual(["Facilities", "Search", "AI summary", "Feedback"]);
	});
});

describe("useAppMetricsScreenRules", () => {
	beforeEach(() => {
		mockMetrics.mockReturnValue({ data: METRICS, isPending: false, isError: false });
		mockPeople.mockReturnValue({ data: PEOPLE });
	});

	it("builds the screen and pages through people", () => {
		const { result } = renderHook(() => useAppMetricsScreenRules(), { wrapper });

		expect(result.current.status).toBe("ready");
		expect(result.current.view?.tiles).toHaveLength(3);
		expect(result.current.rows).toHaveLength(2);
		expect(result.current.pageLabel).toBe("Page 1 of 2");
		expect(mockPeople).toHaveBeenLastCalledWith(1);

		act(() => result.current.setPage(2));

		expect(mockPeople).toHaveBeenLastCalledWith(2);
		expect(result.current.page).toBe(2);
	});

	it("waits for the data", () => {
		mockMetrics.mockReturnValue({ data: undefined, isPending: true, isError: false });
		mockPeople.mockReturnValue({ data: undefined });
		const { result } = renderHook(() => useAppMetricsScreenRules(), { wrapper });

		expect(result.current).toMatchObject({ status: "loading", view: null, rows: [], pageCount: 1 });
	});
});
