import type {
	AppSessionFilterOptions,
	AppSessionFilters,
	AppSessionHeatmapCellView,
	AppSessionHeatmapRepository,
	Clock,
	StatsPeriod,
} from "@market-health-map/core/application";
import {
	isExpired,
	remember,
} from "@server/infrastructure/repositories/warehouse/cache-entry/cache-entry";
import type { CacheEntry } from "@server/infrastructure/repositories/warehouse/cache-entry/cache-entry.types";

export const APP_SESSION_HEATMAP_CACHE_TTL_MS = 60 * 60 * 1000;

export class CachedAppSessionHeatmapRepository implements AppSessionHeatmapRepository {
	private readonly cache = new Map<string, CacheEntry<AppSessionHeatmapCellView[]>>();

	private readonly optionsCache = new Map<string, CacheEntry<AppSessionFilterOptions>>();

	constructor(
		private readonly inner: AppSessionHeatmapRepository,
		private readonly clock: Clock,
		private readonly ttlMs: number = APP_SESSION_HEATMAP_CACHE_TTL_MS,
	) {}

	listFilterOptions(): Promise<AppSessionFilterOptions> {
		const now = this.clock.now().getTime();
		const cached = this.optionsCache.get("options");
		if (cached && !isExpired(cached, now)) return cached.value;
		return remember(this.optionsCache, "options", this.inner.listFilterOptions(), now + this.ttlMs);
	}

	listSessions(
		period: StatsPeriod,
		filters: AppSessionFilters,
		today: string,
	): Promise<AppSessionHeatmapCellView[]> {
		const now = this.clock.now().getTime();
		const key = JSON.stringify([
			today,
			period,
			filters.metric,
			Array.isArray(filters.gender) ? [...filters.gender].sort() : filters.gender,
			Array.isArray(filters.skill) ? [...filters.skill].sort() : filters.skill,
			filters.ageMin,
			filters.ageMax,
		]);
		const cached = this.cache.get(key);
		if (!cached || isExpired(cached, now)) {
			for (const [entryKey, entry] of this.cache) {
				if (isExpired(entry, now)) this.cache.delete(entryKey);
			}
			if (this.cache.size >= 100) this.cache.delete(this.cache.keys().next().value as string);
			return remember(
				this.cache,
				key,
				this.inner.listSessions(period, filters, today),
				now + this.ttlMs,
			);
		}
		return cached.value;
	}
}
