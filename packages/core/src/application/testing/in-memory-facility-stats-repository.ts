import type {
	FacilityStatsRepository,
	FacilityWeeklyCounts,
} from "@core/application/ports/facility-stats-repository.types";
import type { EntityId } from "@core/domain";

export class InMemoryFacilityStatsRepository implements FacilityStatsRepository {
	readonly requested: EntityId[] = [];

	constructor(private readonly counts: FacilityWeeklyCounts) {}

	async getWeeklyCounts(facilityId: EntityId): Promise<FacilityWeeklyCounts> {
		this.requested.push(facilityId);
		return { ...this.counts };
	}
}
