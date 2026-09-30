import type { Clock } from "@core/application/providers/clock.types";
import type { DailyActivityRepository } from "@core/application/repositories/daily-activity-repository.types";

export interface AppMetricsDeps {
	dailyActivity: DailyActivityRepository;
	clock: Clock;
	targetEmails: string[];
}
