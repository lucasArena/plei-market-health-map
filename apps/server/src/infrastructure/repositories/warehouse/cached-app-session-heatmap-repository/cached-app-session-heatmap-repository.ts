import type {
	AppSessionHeatmapCellView,
	AppSessionHeatmapRepository,
	Clock,
} from "@market-health-map/core/application";
import { TtlCache } from "@server/infrastructure/repositories/warehouse/ttl-cache/ttl-cache";

export const APP_SESSION_HEATMAP_CACHE_TTL_MS = 5 * 60 * 1000;

export class CachedAppSessionHeatmapRepository implements AppSessionHeatmapRepository {
	private readonly cache: TtlCache<AppSessionHeatmapCellView[]>;

	constructor(
		private readonly inner: AppSessionHeatmapRepository,
		clock: Clock,
		ttlMs: number = APP_SESSION_HEATMAP_CACHE_TTL_MS,
	) {
		this.cache = new TtlCache({
			now: () => clock.now().getTime(),
			ttlMs,
		});
	}

	listLast28Days(): Promise<AppSessionHeatmapCellView[]> {
		return this.cache.get("last-28-days", () => this.inner.listLast28Days());
	}
}
