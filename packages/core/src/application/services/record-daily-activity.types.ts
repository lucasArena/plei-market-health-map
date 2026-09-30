import type { Clock } from "@core/application/providers/clock.types";
import type { DailyActivityRepository } from "@core/application/repositories/daily-activity-repository.types";

export interface RecordDailyActivityDeps {
	dailyActivity: DailyActivityRepository;
	clock: Clock;
}
