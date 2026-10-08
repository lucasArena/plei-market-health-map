import type {
	Clock,
	FacilityGameComparison,
	FacilityGameComparisonRepository,
	FacilityPlayerStats,
	FacilityReservationStats,
	FacilityReservationStatsFilters,
	FacilityStatsRepository,
} from "@market-health-map/core/application";
import { type EntityId, normalizeGameDepartments } from "@market-health-map/core/domain";
import {
	isExpired,
	remember,
} from "@server/infrastructure/repositories/warehouse/cache-entry/cache-entry";
import type { CacheEntry } from "@server/infrastructure/repositories/warehouse/cache-entry/cache-entry.types";

export const FACILITY_STATS_CACHE_TTL_MS = 5 * 60 * 1000;
export const FACILITY_PLAYER_STATS_CACHE_TTL_MS = 60 * 60 * 1000;

export class CachedFacilityStatsRepository implements FacilityStatsRepository {
	private readonly reservationCache = new Map<string, CacheEntry<FacilityReservationStats>>();
	private readonly comparisonCache = new Map<string, CacheEntry<FacilityGameComparison[]>>();
	private readonly playerCache = new Map<string, CacheEntry<FacilityPlayerStats>>();

	constructor(
		private readonly inner: FacilityStatsRepository & FacilityGameComparisonRepository,
		private readonly clock: Clock,
		private readonly ttlMs: number = FACILITY_STATS_CACHE_TTL_MS,
		private readonly playerTtlMs: number = FACILITY_PLAYER_STATS_CACHE_TTL_MS,
	) {}

	getReservationStats(
		facilityIds: EntityId[],
		filters?: FacilityReservationStatsFilters,
	): Promise<FacilityReservationStats> {
		const now = this.clock.now().getTime();
		const departments = normalizeGameDepartments(filters?.departments);
		const key = this.reservationKeyFor(facilityIds, departments);
		const cached = this.reservationCache.get(key);
		if (!cached || isExpired(cached, now)) {
			const fromWarehouse =
				departments.length > 0
					? this.inner.getReservationStats(facilityIds, { departments })
					: this.inner.getReservationStats(facilityIds);
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
			return remember(this.playerCache, key, fromWarehouse, now + this.playerTtlMs);
		}
		return cached.value;
	}

	private keyFor(facilityIds: EntityId[]): string {
		return [...facilityIds].sort().join(",");
	}

	private reservationKeyFor(facilityIds: EntityId[], departments: readonly string[]): string {
		const ids = this.keyFor(facilityIds);
		return departments.length > 0 ? `${ids}|departments=${departments.join(",")}` : ids;
	}
}
