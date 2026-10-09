import type {
	FacilityQualityPeriodView,
	FacilityQualityView,
} from "@core/application/dtos/facility-quality-dto.types";
import { roundTo } from "@core/application/mappers/facility-stats-mapper";
import type {
	FacilityQuality,
	FacilityQualityPeriodCounts,
	FacilityQualityWindowCounts,
} from "@core/application/repositories/facility-quality-repository.types";

export function qualityRate(numerator: number, denominator: number): number | null {
	if (denominator <= 0) return null;
	return roundTo((numerator / denominator) * 100, 1);
}

export function qualityAverage(total: number, count: number, decimals = 1): number | null {
	if (count <= 0) return null;
	return roundTo(total / count, decimals);
}

function windowView(counts: FacilityQualityWindowCounts) {
	return {
		averagePlayersPerGame: qualityAverage(counts.rosterPlayers, counts.rosterGames),
		waitlistGamesRate: qualityRate(counts.waitlistGames, counts.playedGames),
		almostFilledRate: qualityRate(counts.almostFilledGames, counts.rosteredCancelledGames),
		averageRating: qualityAverage(counts.ratingTotal, counts.ratingCount, 2),
		incidentGamesRate: qualityRate(counts.incidentGames, counts.playedGames),
		returningPlayersRate: qualityRate(counts.returningPlayers, counts.players),
	};
}

export function toFacilityQualityPeriodView({
	current,
	previous,
}: FacilityQualityPeriodCounts): FacilityQualityPeriodView {
	const now = windowView(current);
	const before = windowView(previous);
	return {
		averagePlayersPerGame: now.averagePlayersPerGame,
		averagePlayersPerGamePrevious: before.averagePlayersPerGame,
		waitlistGamesRate: now.waitlistGamesRate,
		waitlistGamesRatePrevious: before.waitlistGamesRate,
		almostFilledRate: now.almostFilledRate,
		almostFilledRatePrevious: before.almostFilledRate,
		averageRating: now.averageRating,
		averageRatingPrevious: before.averageRating,
		ratingCount: current.ratingCount,
		incidentGamesRate: now.incidentGamesRate,
		incidentGamesRatePrevious: before.incidentGamesRate,
		returningPlayersRate: now.returningPlayersRate,
		returningPlayersRatePrevious: before.returningPlayersRate,
	};
}

export function toFacilityQualityView(quality: FacilityQuality): FacilityQualityView {
	return {
		periods: {
			week: toFacilityQualityPeriodView(quality.periods.week),
			month: toFacilityQualityPeriodView(quality.periods.month),
		},
		lowReviews: quality.lowReviews.map((review) => ({ ...review })),
	};
}
