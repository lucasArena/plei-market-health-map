import {
	qualityAverage,
	qualityRate,
	toFacilityQualityView,
} from "@core/application/mappers/facility-quality-mapper";
import type { FacilityQualityWindowCounts } from "@core/application/repositories/facility-quality-repository.types";

function windowCounts(overrides: Partial<FacilityQualityWindowCounts> = {}) {
	return {
		playedGames: 40,
		rosterGames: 38,
		rosterPlayers: 517,
		waitlistGames: 9,
		rosteredCancelledGames: 6,
		almostFilledGames: 2,
		incidentGames: 3,
		ratingCount: 61,
		ratingTotal: 271,
		players: 300,
		returningPlayers: 112,
		...overrides,
	};
}

const EMPTY = windowCounts({
	playedGames: 0,
	rosterGames: 0,
	rosterPlayers: 0,
	waitlistGames: 0,
	rosteredCancelledGames: 0,
	almostFilledGames: 0,
	incidentGames: 0,
	ratingCount: 0,
	ratingTotal: 0,
	players: 0,
	returningPlayers: 0,
});

describe("facility quality rates", () => {
	it("returns a percentage rounded to one decimal", () => {
		expect(qualityRate(1, 3)).toBe(33.3);
		expect(qualityRate(2, 3)).toBe(66.7);
	});

	it("returns null when the denominator is zero", () => {
		expect(qualityRate(0, 0)).toBeNull();
		expect(qualityAverage(5, 0)).toBeNull();
	});

	it("averages to one decimal by default and to the asked precision", () => {
		expect(qualityAverage(517, 38)).toBe(13.6);
		expect(qualityAverage(271, 61, 2)).toBe(4.44);
	});
});

describe("toFacilityQualityView", () => {
	it("maps both periods with the current and previous windows", () => {
		const view = toFacilityQualityView({
			periods: {
				week: { current: windowCounts(), previous: EMPTY },
				month: {
					current: windowCounts({ playedGames: 160, waitlistGames: 40, ratingCount: 200 }),
					previous: windowCounts(),
				},
			},
			lowReviews: [{ id: "77", rate: 1, date: "2026-10-01", title: "Late start" }],
		});

		expect(view.periods.week).toEqual({
			averagePlayersPerGame: 13.6,
			averagePlayersPerGamePrevious: null,
			waitlistGamesRate: 22.5,
			waitlistGamesRatePrevious: null,
			almostFilledRate: 33.3,
			almostFilledRatePrevious: null,
			averageRating: 4.44,
			averageRatingPrevious: null,
			ratingCount: 61,
			incidentGamesRate: 7.5,
			incidentGamesRatePrevious: null,
			returningPlayersRate: 37.3,
			returningPlayersRatePrevious: null,
		});
		expect(view.periods.month).toMatchObject({
			waitlistGamesRate: 25,
			waitlistGamesRatePrevious: 22.5,
			ratingCount: 200,
			averageRating: 1.36,
			averageRatingPrevious: 4.44,
		});
		expect(view.lowReviews).toEqual([
			{ id: "77", rate: 1, date: "2026-10-01", title: "Late start" },
		]);
	});
});
