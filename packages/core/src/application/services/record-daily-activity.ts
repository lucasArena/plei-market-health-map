import {
	activityUserSchema,
	DAILY_ACTIVITY_RETENTION_DAYS,
	recordActivitySchema,
} from "@core/application/dtos/app-metrics-dto";
import type { RecordDailyActivityInput } from "@core/application/dtos/app-metrics-dto.types";
import { normalizeEmail } from "@core/application/mappers/app-metrics-mapper";
import type { RecordDailyActivityDeps } from "@core/application/services/record-daily-activity.types";
import { addDays, easternDay } from "@core/domain";

export function makeRecordDailyActivity({ dailyActivity, clock }: RecordDailyActivityDeps) {
	let lastPrunedDay: string | null = null;

	return async function recordDailyActivity({
		user,
		report,
	}: RecordDailyActivityInput): Promise<void> {
		const { userId, email, name } = activityUserSchema.parse(user);
		const { minutes, visits, counters } = recordActivitySchema.parse(report);
		const at = clock.now();
		const day = easternDay(at);
		await dailyActivity.record({
			userId,
			email: normalizeEmail(email),
			name,
			day,
			at,
			minutes,
			visits,
			counters,
		});
		if (lastPrunedDay === day) return;
		lastPrunedDay = day;
		await dailyActivity.deleteBefore(addDays(day, -DAILY_ACTIVITY_RETENTION_DAYS));
	};
}
