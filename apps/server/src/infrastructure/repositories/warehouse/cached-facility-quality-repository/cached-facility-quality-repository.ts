import type {
	Clock,
	FacilityQuality,
	FacilityQualityRepository,
} from "@market-health-map/core/application";
import type { EntityId } from "@market-health-map/core/domain";
import {
	isExpired,
	remember,
} from "@server/infrastructure/repositories/warehouse/cache-entry/cache-entry";
import type { CacheEntry } from "@server/infrastructure/repositories/warehouse/cache-entry/cache-entry.types";

export const FACILITY_QUALITY_CACHE_TTL_MS = 5 * 60 * 1000;

export const FACILITY_QUALITY_CACHE_MAX_ENTRIES = 500;

export class CachedFacilityQualityRepository implements FacilityQualityRepository {
	private readonly cache = new Map<string, CacheEntry<FacilityQuality>>();

	constructor(
		private readonly inner: FacilityQualityRepository,
		private readonly clock: Clock,
		private readonly ttlMs: number = FACILITY_QUALITY_CACHE_TTL_MS,
	) {}

	getQuality(facilityIds: EntityId[], today: string): Promise<FacilityQuality> {
		const now = this.clock.now().getTime();
		const key = `${today}|${[...facilityIds].sort().join(",")}`;
		const cached = this.cache.get(key);
		if (cached && !isExpired(cached, now)) return cached.value;
		for (const [entryKey, entry] of this.cache) {
			if (isExpired(entry, now)) this.cache.delete(entryKey);
		}
		if (this.cache.size >= FACILITY_QUALITY_CACHE_MAX_ENTRIES) {
			this.cache.delete(this.cache.keys().next().value as string);
		}
		return remember(this.cache, key, this.inner.getQuality(facilityIds, today), now + this.ttlMs);
	}
}
