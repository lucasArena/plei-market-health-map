import type {
	FacilityPlayerStats,
	FacilityReservationStats,
	FacilityStatsRepository,
	FacilityWeeklyCounts,
} from "@core/application/repositories/facility-stats-repository.types";
import type { EntityId } from "@core/domain";

export class InMemoryFacilityStatsRepository implements FacilityStatsRepository {
	readonly reservationRequested: EntityId[][] = [];
	readonly playerRequested: EntityId[][] = [];

	constructor(private readonly counts: FacilityWeeklyCounts) {}

	async getReservationStats(facilityIds: EntityId[]): Promise<FacilityReservationStats> {
		this.reservationRequested.push([...facilityIds]);
		const {
			uniquePlayersLast28Days: _uniquePlayersLast28Days,
			uniquePlayersPrevious28Days: _uniquePlayersPrevious28Days,
			activatedPlayersLast28Days: _activatedPlayersLast28Days,
			activatedPlayersPrevious28Days: _activatedPlayersPrevious28Days,
			...reservationStats
		} = this.counts;
		return { ...reservationStats };
	}

	async getPlayerStats(facilityIds: EntityId[]): Promise<FacilityPlayerStats> {
		this.playerRequested.push([...facilityIds]);
		return {
			uniquePlayersLast28Days: this.counts.uniquePlayersLast28Days,
			uniquePlayersPrevious28Days: this.counts.uniquePlayersPrevious28Days,
			activatedPlayersLast28Days: this.counts.activatedPlayersLast28Days,
			activatedPlayersPrevious28Days: this.counts.activatedPlayersPrevious28Days,
		};
	}
}
