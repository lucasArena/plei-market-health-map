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

export interface FacilityWeeklyCounts {
	weekStart: string;
	playedLastWeek: number;
	playedPreviousWeek: number;
	playedLast28Days: number;
	playedPrevious28Days: number;
	scheduledLast28Days: number;
	scheduledPrevious28Days: number;
	uniquePlayersLast28Days: number;
	uniquePlayersPrevious28Days: number;
	activatedPlayersLast28Days: number;
	activatedPlayersPrevious28Days: number;
	scheduledLastWeek: number;
	cancelledLastWeek: number;
	upcomingNextSevenDays: number;
	lastPlayedDate: string | null;
	weeklyActivity: FacilityWeeklyActivity[];
	popularTimes: FacilityPopularTime[];
}

export interface FacilityStatsRepository {
	getWeeklyCounts(facilityIds: EntityId[]): Promise<FacilityWeeklyCounts>;
}
