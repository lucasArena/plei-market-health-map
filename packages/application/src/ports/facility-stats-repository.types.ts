import type { EntityId } from "@market-health-map/domain";

export interface FacilityWeeklyCounts {
	weekStart: string;
	playedLastWeek: number;
	playedPreviousWeek: number;
	playedLast28Days: number;
	scheduledLastWeek: number;
	cancelledLastWeek: number;
	upcomingNextSevenDays: number;
	lastPlayedDate: string | null;
}

export interface FacilityStatsRepository {
	getWeeklyCounts(facilityId: EntityId): Promise<FacilityWeeklyCounts>;
}
