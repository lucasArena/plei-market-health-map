import type {
	Clock,
	RegistrationHeatmapCellView,
	RegistrationHeatmapRepository,
} from "@market-health-map/core/application";
import type { CachedRegistrationHeatmap } from "@server/infrastructure/repositories/warehouse/cached-registration-heatmap-repository/cached-registration-heatmap-repository.types";

export const REGISTRATION_HEATMAP_CACHE_TTL_MS = 5 * 60 * 1000;

export class CachedRegistrationHeatmapRepository implements RegistrationHeatmapRepository {
	private cached: CachedRegistrationHeatmap | null = null;

	constructor(
		private readonly inner: RegistrationHeatmapRepository,
		private readonly clock: Clock,
		private readonly ttlMs: number = REGISTRATION_HEATMAP_CACHE_TTL_MS,
	) {}

	listLast28Days(): Promise<RegistrationHeatmapCellView[]> {
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
