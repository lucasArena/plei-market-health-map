import type { EntityId, GameDepartment } from "@core/domain";

export interface FacilityWeeklyActivity {
	weekStart: string;
	gamesPlayed: number;
}

export interface FacilityPopularTime {
	dayOfWeek: number;
	timePeriod: number;
	gamesPlayed: number;
}

export interface FacilityReservationStats {
	periodStart: string;
	periodEnd: string;
	weekStart: string;
	playedLastWeek: number;
	playedPreviousWeek: number;
	playedLast28Days: number;
	playedPrevious28Days: number;
	scheduledLast28Days: number;
	scheduledPrevious28Days: number;
	scheduledLastWeek: number;
	scheduledPreviousWeek: number;
	cancelledLastWeek: number;
	upcomingNextSevenDays: number;
	lastPlayedDate: string | null;
	weeklyActivity: FacilityWeeklyActivity[];
	popularTimes: FacilityPopularTime[];
}

export interface FacilityPlayerStats {
	uniquePlayersLastWeek: number;
	uniquePlayersPreviousWeek: number;
	uniquePlayersLast28Days: number;
	uniquePlayersPrevious28Days: number;
	activatedPlayersLastWeek: number;
	activatedPlayersPreviousWeek: number;
	activatedPlayersLast28Days: number;
	activatedPlayersPrevious28Days: number;
}

export interface FacilityWeeklyCounts extends FacilityReservationStats, FacilityPlayerStats {}

export interface FacilityReservationStatsFilters {
	departments?: readonly GameDepartment[];
}

export interface FacilityReservationStatsRepository {
	getReservationStats(
		facilityIds: EntityId[],
		filters?: FacilityReservationStatsFilters,
	): Promise<FacilityReservationStats>;
}

export interface FacilityPlayerStatsRepository {
	getPlayerStats(facilityIds: EntityId[]): Promise<FacilityPlayerStats>;
}

export interface FacilityStatsRepository
	extends FacilityReservationStatsRepository,
		FacilityPlayerStatsRepository {}

export interface FacilityGameComparison {
	facilityId: EntityId;
	playedLastWeek: number;
	playedPreviousWeek: number;
	playedLast28Days: number;
	playedPrevious28Days: number;
}
export interface FacilityGameComparisonRepository {
	getGameComparisons(facilityIds: EntityId[]): Promise<FacilityGameComparison[]>;
}
