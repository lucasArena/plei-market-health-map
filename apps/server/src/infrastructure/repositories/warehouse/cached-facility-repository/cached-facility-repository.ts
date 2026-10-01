import type { Clock, FacilityRepository } from "@market-health-map/core/application";
import type { Facility } from "@market-health-map/core/domain";
import { TtlCache } from "@server/infrastructure/repositories/warehouse/ttl-cache/ttl-cache";

export const FACILITY_CACHE_TTL_MS = 5 * 60 * 1000;

export class CachedFacilityRepository implements FacilityRepository {
	private readonly cache: TtlCache<Facility[]>;

	constructor(
		private readonly inner: FacilityRepository,
		clock: Clock,
		ttlMs: number = FACILITY_CACHE_TTL_MS,
	) {
		this.cache = new TtlCache({
			now: () => clock.now().getTime(),
			ttlMs,
		});
	}

	listAll(): Promise<Facility[]> {
		return this.cache.get("all", () => this.inner.listAll());
	}
}
