import type { FacilityRepository } from "@core/application/repositories/facility-repository.types";
import type { Facility } from "@core/domain";

export class InMemoryFacilityRepository implements FacilityRepository {
	/** The `today` each `listAll` call was made for. */
	readonly requestedDays: string[] = [];

	constructor(private readonly facilities: Facility[] = []) {}

	async listAll(today: string): Promise<Facility[]> {
		this.requestedDays.push(today);
		return [...this.facilities];
	}
}
