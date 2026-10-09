import type {
	Clock,
	MetricDrillDownQuery,
	MetricDrillDownRepository,
	MetricDrillDownView,
} from "@market-health-map/core/application";
import {
	isExpired,
	remember,
} from "@server/infrastructure/repositories/warehouse/cache-entry/cache-entry";
import type { CacheEntry } from "@server/infrastructure/repositories/warehouse/cache-entry/cache-entry.types";

export const METRIC_DRILL_DOWN_CACHE_TTL_MS = 5 * 60 * 1000;
export const METRIC_DRILL_DOWN_LONG_RANGE_CACHE_TTL_MS = 60 * 60 * 1000;

export class CachedMetricDrillDownRepository implements MetricDrillDownRepository {
	private readonly cache = new Map<string, CacheEntry<MetricDrillDownView>>();

	constructor(
		private readonly inner: MetricDrillDownRepository,
		private readonly clock: Clock,
		private readonly ttlMs: number = METRIC_DRILL_DOWN_CACHE_TTL_MS,
		private readonly longRangeTtlMs: number = METRIC_DRILL_DOWN_LONG_RANGE_CACHE_TTL_MS,
	) {}

	group(query: MetricDrillDownQuery): Promise<MetricDrillDownView> {
		const now = this.clock.now().getTime();
		const key = JSON.stringify([
			query.today,
			query.previousPeriod ?? false,
			query.measure,
			query.range,
			query.grain,
			query.slice,
			query.marketId ?? null,
			query.facilityId ?? null,
			query.department ?? null,
			[...query.departments].sort(),
		]);
		const cached = this.cache.get(key);
		if (!cached || isExpired(cached, now)) {
			for (const [entryKey, entry] of this.cache) {
				if (isExpired(entry, now)) this.cache.delete(entryKey);
			}
			if (this.cache.size >= 100) this.cache.delete(this.cache.keys().next().value as string);
			const ttl = query.range === "7d" || query.range === "28d" ? this.ttlMs : this.longRangeTtlMs;
			return remember(this.cache, key, this.inner.group(query), now + ttl);
		}
		return cached.value;
	}
}
