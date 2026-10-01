import type { Clock, FacilityRepository } from "@market-health-map/core/application";
import type { Facility } from "@market-health-map/core/domain";
import {
	DEFAULT_MAX_STALE_MS,
	StaleWhileRevalidateCache,
} from "@server/infrastructure/repositories/warehouse/stale-while-revalidate-cache/stale-while-revalidate-cache";

export const FACILITY_CACHE_TTL_MS = 5 * 60 * 1000;

export class CachedFacilityRepository implements FacilityRepository {
	private readonly cache: StaleWhileRevalidateCache<Facility[]>;

	constructor(
		private readonly inner: FacilityRepository,
		clock: Clock,
		ttlMs: number = FACILITY_CACHE_TTL_MS,
	) {
		this.cache = new StaleWhileRevalidateCache({
			now: () => clock.now().getTime(),
			ttlMs,
			maxStaleMs: DEFAULT_MAX_STALE_MS,
		});
	}

	listAll(): Promise<Facility[]> {
		return this.cache.get("all", () => this.inner.listAll());
	}
}
