import type {
	FacilityStatsRepository,
	FacilityWeeklyCounts,
} from "@application/ports/facility-stats-repository.types";
import type { EntityId } from "@market-health-map/domain";

export class InMemoryFacilityStatsRepository implements FacilityStatsRepository {
	readonly requested: EntityId[][] = [];

	constructor(private readonly counts: FacilityWeeklyCounts) {}

	async getWeeklyCounts(facilityIds: EntityId[]): Promise<FacilityWeeklyCounts> {
		this.requested.push([...facilityIds]);
		return { ...this.counts };
	}
}
