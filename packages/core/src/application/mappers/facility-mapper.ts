import type { FacilityPointView } from "@core/application/dtos/facility-dto.types";
import type { Facility } from "@core/domain";

export function toFacilityPointView(facility: Facility): FacilityPointView {
	const { id, marketId, name, avatarUrl, location, metrics } = facility.toJSON();
	return {
		id,
		marketId,
		marketName: facility.marketName,
		name,
		avatarUrl,
		isActive: metrics.gamesLast28Days > 0,
		gamesLast28Days: metrics.gamesLast28Days,
		location,
	};
}
