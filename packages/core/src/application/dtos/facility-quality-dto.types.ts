import type { StatsPeriod } from "@core/application/dtos/facility-detail-dto.types";
import type { getFacilityQualitySchema } from "@core/application/dtos/facility-quality-dto";
import type { z } from "zod";

export type GetFacilityQualityInput = z.input<typeof getFacilityQualitySchema>;

export interface FacilityQualityPeriodView {
	averagePlayersPerGame: number | null;
	averagePlayersPerGamePrevious: number | null;
	waitlistGamesRate: number | null;
	waitlistGamesRatePrevious: number | null;
	almostFilledRate: number | null;
	almostFilledRatePrevious: number | null;
	averageRating: number | null;
	averageRatingPrevious: number | null;
	ratingCount: number;
	incidentGamesRate: number | null;
	incidentGamesRatePrevious: number | null;
	returningPlayersRate: number | null;
	returningPlayersRatePrevious: number | null;
}

export interface FacilityLowReviewView {
	id: string;
	rate: number;
	date: string;
	title: string | null;
}

export interface FacilityQualityView {
	periods: Record<StatsPeriod, FacilityQualityPeriodView>;
	lowReviews: FacilityLowReviewView[];
}
