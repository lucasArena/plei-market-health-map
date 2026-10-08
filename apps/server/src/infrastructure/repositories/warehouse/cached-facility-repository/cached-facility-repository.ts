import type { Clock, FacilityRepository } from "@market-health-map/core/application";
import type { Facility } from "@market-health-map/core/domain";
import {
	isExpired,
	remember,
} from "@server/infrastructure/repositories/warehouse/cache-entry/cache-entry";
import type { CacheEntry } from "@server/infrastructure/repositories/warehouse/cache-entry/cache-entry.types";

export const FACILITY_CACHE_TTL_MS = 5 * 60 * 1000;

export class CachedFacilityRepository implements FacilityRepository {
	private readonly cache = new Map<string, CacheEntry<Facility[]>>();

	constructor(
		private readonly inner: FacilityRepository,
		private readonly clock: Clock,
		private readonly ttlMs: number = FACILITY_CACHE_TTL_MS,
	) {}

	listAll(today: string): Promise<Facility[]> {
		const now = this.clock.now().getTime();
		const cached = this.cache.get(today);
		if (!cached || isExpired(cached, now)) {
			for (const [key, entry] of this.cache) {
				if (isExpired(entry, now)) this.cache.delete(key);
			}
			return remember(this.cache, today, this.inner.listAll(today), now + this.ttlMs);
		}
		return cached.value;
	}
}
