import type { FacilityRepository } from "@application/ports/facility-repository.types";
import type { Facility } from "@market-health-map/domain";

export class InMemoryFacilityRepository implements FacilityRepository {
	constructor(private readonly facilities: Facility[] = []) {}

	async listAll(): Promise<Facility[]> {
		return [...this.facilities];
	}
}
