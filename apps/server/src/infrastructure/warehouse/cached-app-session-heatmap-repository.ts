import type {
	AppSessionHeatmapCellView,
	AppSessionHeatmapRepository,
	Clock,
} from "@market-health-map/core/application";
import type { CachedAppSessionHeatmap } from "@server/infrastructure/warehouse/cached-app-session-heatmap-repository.types";

export const APP_SESSION_HEATMAP_CACHE_TTL_MS = 5 * 60 * 1000;

export class CachedAppSessionHeatmapRepository implements AppSessionHeatmapRepository {
	private cached: CachedAppSessionHeatmap | null = null;

	constructor(
		private readonly inner: AppSessionHeatmapRepository,
		private readonly clock: Clock,
		private readonly ttlMs: number = APP_SESSION_HEATMAP_CACHE_TTL_MS,
	) {}

	listLast28Days(): Promise<AppSessionHeatmapCellView[]> {
		const now = this.clock.now().getTime();
		if (this.cached && this.cached.expiresAt > now) return this.cached.value;
		const value = this.inner.listLast28Days();
		this.cached = { expiresAt: now + this.ttlMs, value };
		value.catch(() => {
			this.cached = null;
		});
		return value;
	}
}
