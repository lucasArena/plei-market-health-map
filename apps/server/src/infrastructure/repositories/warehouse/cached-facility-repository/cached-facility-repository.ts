import type { Clock, FacilityRepository } from "@market-health-map/core/application";
import type { Facility } from "@market-health-map/core/domain";
import { RefreshAheadCache } from "@server/infrastructure/repositories/warehouse/refresh-ahead-cache/refresh-ahead-cache";

export const FACILITY_CACHE_TTL_MS = 5 * 60 * 1000;

export class CachedFacilityRepository implements FacilityRepository {
	private readonly cache: RefreshAheadCache<Facility[]>;

	constructor(
		private readonly inner: FacilityRepository,
		clock: Clock,
		ttlMs: number = FACILITY_CACHE_TTL_MS,
	) {
		this.cache = new RefreshAheadCache({
			now: () => clock.now().getTime(),
			ttlMs,
		});
	}

	listAll(): Promise<Facility[]> {
		return this.cache.get("all", () => this.inner.listAll());
	}
}
