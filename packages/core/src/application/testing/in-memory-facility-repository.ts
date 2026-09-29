import type { FacilityRepository } from "@core/application/ports/facility-repository.types";
import type { Facility } from "@core/domain";

export class InMemoryFacilityRepository implements FacilityRepository {
	constructor(private readonly facilities: Facility[] = []) {}

	async listAll(): Promise<Facility[]> {
		return [...this.facilities];
	}
}
