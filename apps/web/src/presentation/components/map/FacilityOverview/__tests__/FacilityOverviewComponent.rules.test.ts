import type { FacilityQualityPeriodView, StatsPeriod } from "@market-health-map/core/application";
import { act, renderHook } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { FACILITY_DETAIL } from "@/application/test/facility-detail";
import { EN_MESSAGES } from "@/application/test/messages";
import {
	averageMetric,
	buildFacilityDemand,
	buildFacilityRank,
	buildFacilitySatisfaction,
	useFacilityOverviewRules,
} from "@/presentation/components/map/FacilityOverview/FacilityOverviewComponent.rules";
import { MessagesProvider } from "@/presentation/components/providers/MessagesProvider/MessagesProviderComponent";

const mockSetScope = vi.fn();
const mockSetPeriod = vi.fn();
const mockSetMapNavigation = vi.fn();
let mockPeriod: StatsPeriod = "month";
const mockReservations = vi.fn();
const mockInsights = vi.fn();
const mockQuality = vi.fn();

vi.mock("@/presentation/components/providers/MapScopeProvider/MapScopeProviderComponent", () => ({
	useMapScope: () => ({
		period: mockPeriod,
		setPeriod: mockSetPeriod,
		setScope: mockSetScope,
		setMapNavigation: mockSetMapNavigation,
	}),
}));
vi.mock("@/presentation/hooks/use-facility/use-facility-reservation-stats", () => ({
	useFacilityReservationStats: (...args: unknown[]) => mockReservations(...args),
}));
vi.mock("@/presentation/hooks/use-market/use-market-game-insights", () => ({
	useMarketGameInsights: (...args: unknown[]) => mockInsights(...args),
}));
vi.mock("@/presentation/hooks/use-facility/use-facility-quality", () => ({
	useFacilityQuality: (...args: unknown[]) => mockQuality(...args),
}));

const messages = EN_MESSAGES.facilityView;
const summaryMessages = EN_MESSAGES.marketSummary;
const number = new Intl.NumberFormat("en");

function facility(id: string, playedPrevious: number, played: number) {
	return {
		id,
		name: `Facility ${id}`,
		played,
		playedPrevious,
		change: played - playedPrevious,
		changePercent: null,
	};
}

const QUALITY: FacilityQualityPeriodView = {
	averagePlayersPerGame: 11.4,
	averagePlayersPerGamePrevious: 10.9,
	waitlistGamesRate: 12.5,
	waitlistGamesRatePrevious: 15,
	almostFilledRate: 40,
	almostFilledRatePrevious: 30,
	averageRating: 4.62,
	averageRatingPrevious: 4.7,
	ratingCount: 84,
	incidentGamesRate: 3.2,
	incidentGamesRatePrevious: 3.2,
	returningPlayersRate: 41,
	returningPlayersRatePrevious: 38,
};

describe("facility overview rules", () => {
	it("ranks the facility in its market by games and by change", () => {
		const rank = buildFacilityRank(
			"b",
			[facility("a", 10, 30), facility("b", 20, 12), facility("c", 5, 9), facility("z", 0, 0)],
			"Houston",
			messages,
			number,
		);

		expect(rank).toEqual({
			title: "Rank in Houston",
			rows: [
				{ key: "games", label: "By games", value: "#2", previous: "of 3", change: null },
				{ key: "change", label: "By change", value: "#3", previous: "of 3", change: null },
			],
		});
		expect(buildFacilityRank("z", [facility("z", 0, 0)], "Houston", messages, number)).toBeNull();
		expect(buildFacilityRank("b", undefined, "Houston", messages, number)).toBeNull();
	});

	it("compares averages with their own precision", () => {
		const oneDecimal = new Intl.NumberFormat("en", {
			maximumFractionDigits: 1,
			minimumFractionDigits: 1,
		});

		expect(
			averageMetric("a", "Avg", 11.4, 10.9, "higherIsBetter", summaryMessages, oneDecimal),
		).toEqual({
			key: "a",
			label: "Avg",
			value: "11.4",
			previous: "vs 10.9",
			change: { label: "+0.5", direction: "up", tone: "good" },
		});
		expect(
			averageMetric("a", "Avg", null, 10.9, "higherIsBetter", summaryMessages, oneDecimal),
		).toMatchObject({ value: "—", change: null });
	});

	it("builds demand with good and bad changes", () => {
		const demand = buildFacilityDemand(QUALITY, messages, summaryMessages, "en");

		expect(demand.title).toBe("Demand");
		expect(
			demand.rows.map((row) => [row.label, row.value, row.change?.label, row.change?.tone]),
		).toEqual([
			["Avg players per game", "11.4", "+0.5", "good"],
			["Games with a waitlist", "13%", "−2 pts", "bad"],
			["Cancelled 1–3 players short", "40%", "+10 pts", "bad"],
		]);
	});

	it("builds satisfaction with the review count and recent low reviews", () => {
		const satisfaction = buildFacilitySatisfaction(
			QUALITY,
			[
				{ id: "r1", rate: 2, date: "2026-10-03", title: "Field was flooded" },
				{ id: "r2", rate: 1, date: "2026-09-28", title: null },
			],
			messages,
			summaryMessages,
			"en",
		);

		expect(
			satisfaction.rows.map((row) => [row.value, row.change?.label, row.change?.tone]),
		).toEqual([
			["4.62", "−0.08", "bad"],
			["3%", "0 pts", "neutral"],
			["41%", "+3 pts", "good"],
		]);
		expect(satisfaction.footnote).toBe("Based on 84 reviews");
		expect(satisfaction.reviews).toEqual([
			{ id: "r1", rate: "2 ★", date: "Oct 3", title: "Field was flooded" },
			{ id: "r2", rate: "1 ★", date: "Sep 28", title: "No title" },
		]);
		expect(
			buildFacilitySatisfaction({ ...QUALITY, ratingCount: 0 }, [], messages, summaryMessages, "en")
				.footnote,
		).toBeNull();
	});
});

function wrapper({ children }: { children: ReactNode }) {
	return createElement(MessagesProvider, { locale: "en", messages: EN_MESSAGES, children });
}

describe("useFacilityOverviewRules", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockPeriod = "month";
	});

	it("builds the facility view from its stats, its market and its quality", () => {
		mockReservations.mockReturnValue({ data: FACILITY_DETAIL });
		mockInsights.mockReturnValue({
			data: [
				{
					id: FACILITY_DETAIL.facility.marketId,
					facilities: [facility(FACILITY_DETAIL.facility.id, 5, 9)],
				},
			],
		});
		mockQuality.mockReturnValue({
			data: { periods: { week: QUALITY, month: QUALITY }, lowReviews: [] },
		});

		const { result } = renderHook(
			() =>
				useFacilityOverviewRules({
					facilityId: FACILITY_DETAIL.facility.id,
					facilityName: "Pegaso HTX",
					marketName: "Houston",
				}),
			{ wrapper },
		);

		expect(mockInsights).toHaveBeenCalledWith(FACILITY_DETAIL.facility.marketId, "month", true, []);
		expect(result.current.header).toMatchObject({
			title: "Pegaso HTX",
			level: "Facility",
			subtitle: FACILITY_DETAIL.facility.address,
		});
		expect(result.current.sections?.scorecards.played.label).toBe("Games played");
		expect(result.current.sections?.trend.metrics).toEqual([]);
		expect(result.current.rank?.rows[0]?.value).toBe("#1");
		expect(result.current.demand.rows[0]?.isPending).toBeUndefined();
		expect(result.current.satisfaction?.emptyReviews).toBe("No low reviews in the last 28 days.");

		act(() => result.current.header.breadcrumb[0]?.onSelect?.());
		expect(mockSetScope).toHaveBeenCalledWith({ kind: "all" });
		act(() => result.current.header.breadcrumb[1]?.onSelect?.());
		expect(mockSetMapNavigation).toHaveBeenCalledWith({
			kind: "market",
			id: FACILITY_DETAIL.facility.marketId,
			name: "Houston",
		});
	});

	it("keeps loading placeholders until the data arrives", () => {
		mockReservations.mockReturnValue({ data: undefined });
		mockInsights.mockReturnValue({ data: undefined });
		mockQuality.mockReturnValue({ data: undefined });

		const { result } = renderHook(
			() =>
				useFacilityOverviewRules({
					facilityId: "889",
					facilityName: "Pegaso HTX",
					marketName: "Houston",
				}),
			{ wrapper },
		);

		expect(mockInsights).toHaveBeenCalledWith(null, "month", false, []);
		expect(result.current.sections).toBeNull();
		expect(result.current.rank).toBeNull();
		expect(result.current.satisfaction).toBeNull();
		expect(result.current.demand.rows.every((row) => row.isPending)).toBe(true);
		expect(result.current.satisfactionPending.rows).toHaveLength(3);
		expect(result.current.header.breadcrumb[1]?.onSelect).toBeUndefined();
		expect(result.current.header.subtitle).toBeNull();
	});
});
