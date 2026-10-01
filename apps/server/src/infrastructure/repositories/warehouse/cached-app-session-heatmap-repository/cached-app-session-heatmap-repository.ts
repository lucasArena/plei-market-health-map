import type {
	AppSessionHeatmapCellView,
	AppSessionHeatmapRepository,
	Clock,
} from "@market-health-map/core/application";
import { RefreshAheadCache } from "@server/infrastructure/repositories/warehouse/refresh-ahead-cache/refresh-ahead-cache";

export const APP_SESSION_HEATMAP_CACHE_TTL_MS = 5 * 60 * 1000;

export class CachedAppSessionHeatmapRepository implements AppSessionHeatmapRepository {
	private readonly cache: RefreshAheadCache<AppSessionHeatmapCellView[]>;

	constructor(
		private readonly inner: AppSessionHeatmapRepository,
		clock: Clock,
		ttlMs: number = APP_SESSION_HEATMAP_CACHE_TTL_MS,
	) {
		this.cache = new RefreshAheadCache({
			now: () => clock.now().getTime(),
			ttlMs,
		});
	}

	listLast28Days(): Promise<AppSessionHeatmapCellView[]> {
		return this.cache.get("last-28-days", () => this.inner.listLast28Days());
	}
}
