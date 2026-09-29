import type { FacilityPointView } from "@application/dtos/facility-dto.types";
import type { Facility } from "@market-health-map/domain";

export function toFacilityPointView(facility: Facility): FacilityPointView {
	const { id, marketId, name, avatarUrl, location, metrics } = facility.toJSON();
	return { id, marketId, name, avatarUrl, isActive: metrics.gamesLast28Days > 0, location };
}
