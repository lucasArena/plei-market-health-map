import type {
	Clock,
	DailyActivity,
	DailyActivityIncrement,
	DailyActivityRepository,
} from "@market-health-map/core/application";
import type { CachedDailyActivityRange } from "@server/infrastructure/repositories/database/cached-daily-activity-repository/cached-daily-activity-repository.types";

export const DAILY_ACTIVITY_CACHE_TTL_MS = 5 * 60 * 1000;

export class CachedDailyActivityRepository implements DailyActivityRepository {
	private readonly ranges = new Map<string, CachedDailyActivityRange>();

	constructor(
		private readonly inner: DailyActivityRepository,
		private readonly clock: Clock,
		private readonly ttlMs: number = DAILY_ACTIVITY_CACHE_TTL_MS,
	) {}

	record(increment: DailyActivityIncrement): Promise<void> {
		return this.inner.record(increment);
	}

	listBetween(fromDay: string, toDay: string): Promise<DailyActivity[]> {
		const key = `${fromDay}:${toDay}`;
		const now = this.clock.now().getTime();
		const cached = this.ranges.get(key);
		if (cached && cached.expiresAt > now) return cached.value;
		const value = this.inner.listBetween(fromDay, toDay);
		this.ranges.set(key, { expiresAt: now + this.ttlMs, value });
		value.catch(() => this.ranges.delete(key));
		return value;
	}

	deleteBefore(day: string): Promise<void> {
		return this.inner.deleteBefore(day);
	}
}
