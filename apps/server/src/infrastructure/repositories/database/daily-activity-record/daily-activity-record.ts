import type { DailyActivity } from "@market-health-map/core/application";
import type { DailyActivityRecord } from "@server/infrastructure/repositories/database/daily-activity-record/daily-activity-record.types";

export function toDayDate(day: string): Date {
	return new Date(`${day}T00:00:00Z`);
}

export function toDailyActivity(record: DailyActivityRecord): DailyActivity {
	return {
		userId: record.userId,
		email: record.email,
		name: record.name,
		day: record.day.toISOString().slice(0, 10),
		firstSeenAt: record.firstSeenAt,
		lastSeenAt: record.lastSeenAt,
		minutesActive: record.minutesActive,
		visits: record.visits,
		counters: {
			facilitiesOpened: record.facilitiesOpened,
			marketSummariesOpened: record.marketSummariesOpened,
			searches: record.searches,
			aiSummaries: record.aiSummaries,
			feedbackSent: record.feedbackSent,
		},
	};
}
