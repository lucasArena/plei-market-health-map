import type {
	FacilityGameComparison,
	FacilityPlayerStats,
	FacilityPlayerStatsFilters,
	FacilityReservationStats,
	FacilityReservationStatsFilters,
	FacilityStatsRepository,
	FacilityWeeklyCounts,
} from "@core/application/repositories/facility-stats-repository.types";
import type { EntityId } from "@core/domain";

export class InMemoryFacilityStatsRepository implements FacilityStatsRepository {
	readonly reservationRequested: EntityId[][] = [];
	readonly reservationFilters: (FacilityReservationStatsFilters | undefined)[] = [];
	readonly playerRequested: EntityId[][] = [];
	readonly playerFilters: (FacilityPlayerStatsFilters | undefined)[] = [];
	readonly requestedDays: string[] = [];

	constructor(
		private readonly counts: FacilityWeeklyCounts,
		private readonly comparisons: FacilityGameComparison[] = [],
	) {}

	async getReservationStats(
		facilityIds: EntityId[],
		today: string,
		filters?: FacilityReservationStatsFilters,
	): Promise<FacilityReservationStats> {
		this.requestedDays.push(today);
		this.reservationRequested.push([...facilityIds]);
		this.reservationFilters.push(filters);
		const {
			uniquePlayersLastWeek: _uniquePlayersLastWeek,
			uniquePlayersPreviousWeek: _uniquePlayersPreviousWeek,
			activatedPlayersLastWeek: _activatedPlayersLastWeek,
			activatedPlayersPreviousWeek: _activatedPlayersPreviousWeek,
			uniquePlayersLast28Days: _uniquePlayersLast28Days,
			uniquePlayersPrevious28Days: _uniquePlayersPrevious28Days,
			activatedPlayersLast28Days: _activatedPlayersLast28Days,
			activatedPlayersPrevious28Days: _activatedPlayersPrevious28Days,
			...reservationStats
		} = this.counts;
		return { ...reservationStats };
	}

	async getGameComparisons(
		facilityIds: EntityId[],
		today: string,
	): Promise<FacilityGameComparison[]> {
		this.requestedDays.push(today);
		return this.comparisons.filter((row) => facilityIds.includes(row.facilityId));
	}

	async getPlayerStats(
		facilityIds: EntityId[],
		today: string,
		filters?: FacilityPlayerStatsFilters,
	): Promise<FacilityPlayerStats> {
		this.requestedDays.push(today);
		this.playerRequested.push([...facilityIds]);
		this.playerFilters.push(filters);
		return {
			uniquePlayersLastWeek: this.counts.uniquePlayersLastWeek,
			uniquePlayersPreviousWeek: this.counts.uniquePlayersPreviousWeek,
			activatedPlayersLastWeek: this.counts.activatedPlayersLastWeek,
			activatedPlayersPreviousWeek: this.counts.activatedPlayersPreviousWeek,
			uniquePlayersLast28Days: this.counts.uniquePlayersLast28Days,
			uniquePlayersPrevious28Days: this.counts.uniquePlayersPrevious28Days,
			activatedPlayersLast28Days: this.counts.activatedPlayersLast28Days,
			activatedPlayersPrevious28Days: this.counts.activatedPlayersPrevious28Days,
		};
	}
}
