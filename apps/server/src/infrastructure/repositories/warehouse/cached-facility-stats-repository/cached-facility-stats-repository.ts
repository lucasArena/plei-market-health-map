import type {
	Clock,
	FacilityPlayerStats,
	FacilityReservationStats,
	FacilityStatsRepository,
} from "@market-health-map/core/application";
import type { EntityId } from "@market-health-map/core/domain";
import type { CachedFacilityStatsValue } from "@server/infrastructure/repositories/warehouse/cached-facility-stats-repository/cached-facility-stats-repository.types";

export const FACILITY_STATS_CACHE_TTL_MS = 5 * 60 * 1000;

export class CachedFacilityStatsRepository implements FacilityStatsRepository {
	private readonly reservationCache = new Map<
		string,
		CachedFacilityStatsValue<FacilityReservationStats>
	>();
	private readonly playerCache = new Map<string, CachedFacilityStatsValue<FacilityPlayerStats>>();

	constructor(
		private readonly inner: FacilityStatsRepository,
		private readonly clock: Clock,
		private readonly ttlMs: number = FACILITY_STATS_CACHE_TTL_MS,
	) {}

	getReservationStats(facilityIds: EntityId[]): Promise<FacilityReservationStats> {
		const key = this.keyFor(facilityIds);
		const cached = this.reservationCache.get(key);
		const now = this.clock.now().getTime();
		if (cached && cached.expiresAt > now) return cached.value;
		const value = this.inner.getReservationStats(facilityIds);
		this.reservationCache.set(key, { expiresAt: now + this.ttlMs, value });
		value.catch(() => {
			this.reservationCache.delete(key);
		});
		return value;
	}

	getPlayerStats(facilityIds: EntityId[]): Promise<FacilityPlayerStats> {
		const key = this.keyFor(facilityIds);
		const cached = this.playerCache.get(key);
		const now = this.clock.now().getTime();
		if (cached && cached.expiresAt > now) return cached.value;
		const value = this.inner.getPlayerStats(facilityIds);
		this.playerCache.set(key, { expiresAt: now + this.ttlMs, value });
		value.catch(() => {
			this.playerCache.delete(key);
		});
		return value;
	}

	private keyFor(facilityIds: EntityId[]): string {
		return [...facilityIds].sort().join(",");
	}
}
