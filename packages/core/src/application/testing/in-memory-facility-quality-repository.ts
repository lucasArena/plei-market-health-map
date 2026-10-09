import type {
	FacilityQuality,
	FacilityQualityRepository,
} from "@core/application/repositories/facility-quality-repository.types";
import type { EntityId } from "@core/domain";

export class InMemoryFacilityQualityRepository implements FacilityQualityRepository {
	readonly requested: EntityId[][] = [];
	readonly requestedDays: string[] = [];

	constructor(private readonly quality: FacilityQuality) {}

	async getQuality(facilityIds: EntityId[], today: string): Promise<FacilityQuality> {
		this.requested.push([...facilityIds]);
		this.requestedDays.push(today);
		return structuredClone(this.quality);
	}
}
