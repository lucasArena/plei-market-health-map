import type { EntityId } from "@core/domain";

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
	weekStart: string;
	playedLastWeek: number;
	playedPreviousWeek: number;
	playedLast28Days: number;
	playedPrevious28Days: number;
	scheduledLast28Days: number;
	scheduledPrevious28Days: number;
	scheduledLastWeek: number;
	cancelledLastWeek: number;
	upcomingNextSevenDays: number;
	lastPlayedDate: string | null;
	weeklyActivity: FacilityWeeklyActivity[];
	popularTimes: FacilityPopularTime[];
}

export interface FacilityPlayerStats {
	uniquePlayersLast28Days: number;
	uniquePlayersPrevious28Days: number;
	activatedPlayersLast28Days: number;
	activatedPlayersPrevious28Days: number;
}

export interface FacilityWeeklyCounts extends FacilityReservationStats, FacilityPlayerStats {}

export interface FacilityReservationStatsRepository {
	getReservationStats(facilityIds: EntityId[]): Promise<FacilityReservationStats>;
}

export interface FacilityPlayerStatsRepository {
	getPlayerStats(facilityIds: EntityId[]): Promise<FacilityPlayerStats>;
}

export interface FacilityStatsRepository
	extends FacilityReservationStatsRepository,
		FacilityPlayerStatsRepository {}
