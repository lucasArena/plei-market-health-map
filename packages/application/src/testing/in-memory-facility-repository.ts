import type { FacilityRepository } from "@application/ports/facility-repository.types";
import type { EntityId, Facility } from "@market-health-map/domain";

export class InMemoryFacilityRepository implements FacilityRepository {
	constructor(private readonly facilities: Facility[] = []) {}

	async listByMarket(marketId: EntityId): Promise<Facility[]> {
		return this.facilities.filter((facility) => facility.marketId === marketId);
	}
}
