import type {
	Clock,
	FacilityGameComparison,
	FacilityGameComparisonRepository,
	FacilityPlayerStats,
	FacilityReservationStats,
	FacilityStatsRepository,
} from "@market-health-map/core/application";
import type { EntityId } from "@market-health-map/core/domain";
import { TtlCache } from "@server/infrastructure/repositories/warehouse/ttl-cache/ttl-cache";

export const FACILITY_STATS_CACHE_TTL_MS = 5 * 60 * 1000;

export class CachedFacilityStatsRepository implements FacilityStatsRepository {
	private readonly reservationCache: TtlCache<FacilityReservationStats>;
	private readonly comparisonCache: TtlCache<FacilityGameComparison[]>;
	private readonly playerCache: TtlCache<FacilityPlayerStats>;

	constructor(
		private readonly inner: FacilityStatsRepository & FacilityGameComparisonRepository,
		clock: Clock,
		ttlMs: number = FACILITY_STATS_CACHE_TTL_MS,
	) {
		const options = { now: () => clock.now().getTime(), ttlMs };
		this.reservationCache = new TtlCache(options);
		this.comparisonCache = new TtlCache(options);
		this.playerCache = new TtlCache(options);
	}

	getReservationStats(facilityIds: EntityId[]): Promise<FacilityReservationStats> {
		return this.reservationCache.get(this.keyFor(facilityIds), () =>
			this.inner.getReservationStats(facilityIds),
		);
	}

	getGameComparisons(facilityIds: EntityId[]): Promise<FacilityGameComparison[]> {
		return this.comparisonCache.get(this.keyFor(facilityIds), () =>
			this.inner.getGameComparisons(facilityIds),
		);
	}

	getPlayerStats(facilityIds: EntityId[]): Promise<FacilityPlayerStats> {
		return this.playerCache.get(this.keyFor(facilityIds), () =>
			this.inner.getPlayerStats(facilityIds),
		);
	}

	private keyFor(facilityIds: EntityId[]): string {
		return [...facilityIds].sort().join(",");
	}
}
