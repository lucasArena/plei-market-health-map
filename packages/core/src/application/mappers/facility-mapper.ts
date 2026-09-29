import type { FacilityPointView } from "@core/application/dtos/facility-dto.types";
import type { Facility } from "@core/domain";

export function toFacilityPointView(facility: Facility): FacilityPointView {
	const { id, marketId, name, avatarUrl, location } = facility.toJSON();
	return { id, marketId, name, avatarUrl, location };
}
