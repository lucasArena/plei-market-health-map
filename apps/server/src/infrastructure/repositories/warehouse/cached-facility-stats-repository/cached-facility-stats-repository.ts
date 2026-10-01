import type {
	Clock,
	FacilityGameComparison,
	FacilityGameComparisonRepository,
	FacilityPlayerStats,
	FacilityReservationStats,
	FacilityStatsRepository,
} from "@market-health-map/core/application";
import type { EntityId } from "@market-health-map/core/domain";
import {
	isExpired,
	remember,
} from "@server/infrastructure/repositories/warehouse/cache-entry/cache-entry";
import type { CacheEntry } from "@server/infrastructure/repositories/warehouse/cache-entry/cache-entry.types";

export const FACILITY_STATS_CACHE_TTL_MS = 5 * 60 * 1000;

export class CachedFacilityStatsRepository implements FacilityStatsRepository {
	private readonly reservationCache = new Map<string, CacheEntry<FacilityReservationStats>>();
	private readonly comparisonCache = new Map<string, CacheEntry<FacilityGameComparison[]>>();
	private readonly playerCache = new Map<string, CacheEntry<FacilityPlayerStats>>();

	constructor(
		private readonly inner: FacilityStatsRepository & FacilityGameComparisonRepository,
		private readonly clock: Clock,
		private readonly ttlMs: number = FACILITY_STATS_CACHE_TTL_MS,
	) {}

	getReservationStats(facilityIds: EntityId[]): Promise<FacilityReservationStats> {
		const now = this.clock.now().getTime();
		const key = this.keyFor(facilityIds);
		const cached = this.reservationCache.get(key);
		if (!cached || isExpired(cached, now)) {
			const fromWarehouse = this.inner.getReservationStats(facilityIds);
			return remember(this.reservationCache, key, fromWarehouse, now + this.ttlMs);
		}
		return cached.value;
	}

	getGameComparisons(facilityIds: EntityId[]): Promise<FacilityGameComparison[]> {
		const now = this.clock.now().getTime();
		const key = this.keyFor(facilityIds);
		const cached = this.comparisonCache.get(key);
		if (!cached || isExpired(cached, now)) {
			const fromWarehouse = this.inner.getGameComparisons(facilityIds);
			return remember(this.comparisonCache, key, fromWarehouse, now + this.ttlMs);
		}
		return cached.value;
	}

	getPlayerStats(facilityIds: EntityId[]): Promise<FacilityPlayerStats> {
		const now = this.clock.now().getTime();
		const key = this.keyFor(facilityIds);
		const cached = this.playerCache.get(key);
		if (!cached || isExpired(cached, now)) {
			const fromWarehouse = this.inner.getPlayerStats(facilityIds);
			return remember(this.playerCache, key, fromWarehouse, now + this.ttlMs);
		}
		return cached.value;
	}

	private keyFor(facilityIds: EntityId[]): string {
		return [...facilityIds].sort().join(",");
	}
}
