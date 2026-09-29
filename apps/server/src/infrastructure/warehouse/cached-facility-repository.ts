import type { Clock, FacilityRepository } from "@market-health-map/core/application";
import type { Facility } from "@market-health-map/core/domain";
import type { CachedFacilities } from "@server/infrastructure/warehouse/cached-facility-repository.types";

export const FACILITY_CACHE_TTL_MS = 5 * 60 * 1000;

export class CachedFacilityRepository implements FacilityRepository {
	private cached: CachedFacilities | null = null;

	constructor(
		private readonly inner: FacilityRepository,
		private readonly clock: Clock,
		private readonly ttlMs: number = FACILITY_CACHE_TTL_MS,
	) {}

	listAll(): Promise<Facility[]> {
		const now = this.clock.now().getTime();
		if (this.cached && this.cached.expiresAt > now) return this.cached.value;
		const value = this.inner.listAll();
		this.cached = { expiresAt: now + this.ttlMs, value };
		value.catch(() => {
			this.cached = null;
		});
		return value;
	}
}
