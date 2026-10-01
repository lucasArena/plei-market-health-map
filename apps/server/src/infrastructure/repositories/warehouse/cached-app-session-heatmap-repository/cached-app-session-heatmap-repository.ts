import type {
	AppSessionHeatmapCellView,
	AppSessionHeatmapRepository,
	Clock,
} from "@market-health-map/core/application";
import {
	DEFAULT_MAX_STALE_MS,
	StaleWhileRevalidateCache,
} from "@server/infrastructure/repositories/warehouse/stale-while-revalidate-cache/stale-while-revalidate-cache";

export const APP_SESSION_HEATMAP_CACHE_TTL_MS = 5 * 60 * 1000;

export class CachedAppSessionHeatmapRepository implements AppSessionHeatmapRepository {
	private readonly cache: StaleWhileRevalidateCache<AppSessionHeatmapCellView[]>;

	constructor(
		private readonly inner: AppSessionHeatmapRepository,
		clock: Clock,
		ttlMs: number = APP_SESSION_HEATMAP_CACHE_TTL_MS,
	) {
		this.cache = new StaleWhileRevalidateCache({
			now: () => clock.now().getTime(),
			ttlMs,
			maxStaleMs: DEFAULT_MAX_STALE_MS,
		});
	}

	listLast28Days(): Promise<AppSessionHeatmapCellView[]> {
		return this.cache.get("last-28-days", () => this.inner.listLast28Days());
	}
}
