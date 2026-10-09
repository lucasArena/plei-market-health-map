import type { StatsPeriod } from "@core/application/dtos/facility-detail-dto.types";
import type { EntityId } from "@core/domain";

export interface FacilityQualityWindowCounts {
	playedGames: number;
	rosterGames: number;
	rosterPlayers: number;
	waitlistGames: number;
	rosteredCancelledGames: number;
	almostFilledGames: number;
	incidentGames: number;
	ratingCount: number;
	ratingTotal: number;
	players: number;
	returningPlayers: number;
}

export interface FacilityQualityPeriodCounts {
	current: FacilityQualityWindowCounts;
	previous: FacilityQualityWindowCounts;
}

export interface FacilityLowReview {
	id: string;
	rate: number;
	date: string;
	title: string | null;
}

export interface FacilityQuality {
	periods: Record<StatsPeriod, FacilityQualityPeriodCounts>;
	lowReviews: FacilityLowReview[];
}

export interface FacilityQualityRepository {
	getQuality(facilityIds: EntityId[], today: string): Promise<FacilityQuality>;
}
