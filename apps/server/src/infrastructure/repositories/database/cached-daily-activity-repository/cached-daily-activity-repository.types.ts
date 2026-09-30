import type { DailyActivity } from "@market-health-map/core/application";

export interface CachedDailyActivityRange {
	expiresAt: number;
	value: Promise<DailyActivity[]>;
}
