import type {
	AppSessionHeatmapCellView,
	AppSessionHeatmapRepository,
	Clock,
} from "@market-health-map/core/application";
import {
	isExpired,
	remember,
} from "@server/infrastructure/repositories/warehouse/cache-entry/cache-entry";
import type { CacheEntry } from "@server/infrastructure/repositories/warehouse/cache-entry/cache-entry.types";

export const APP_SESSION_HEATMAP_CACHE_TTL_MS = 5 * 60 * 1000;

export class CachedAppSessionHeatmapRepository implements AppSessionHeatmapRepository {
	private readonly cache = new Map<string, CacheEntry<AppSessionHeatmapCellView[]>>();

	constructor(
		private readonly inner: AppSessionHeatmapRepository,
		private readonly clock: Clock,
		private readonly ttlMs: number = APP_SESSION_HEATMAP_CACHE_TTL_MS,
	) {}

	listLast28Days(): Promise<AppSessionHeatmapCellView[]> {
		const now = this.clock.now().getTime();
		const cached = this.cache.get("last-28-days");
		if (!cached || isExpired(cached, now)) {
			return remember(this.cache, "last-28-days", this.inner.listLast28Days(), now + this.ttlMs);
		}
		return cached.value;
	}
}
