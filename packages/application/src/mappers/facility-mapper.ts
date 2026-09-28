import type { FacilityView } from "@application/dtos/market-detail-dto.types";
import type { Facility } from "@market-health-map/domain";

export function toFacilityView(facility: Facility): FacilityView {
	const props = facility.toJSON();
	return {
		id: props.id,
		marketId: props.marketId,
		name: props.name,
		address: props.address,
		avatarUrl: props.avatarUrl,
		metrics: props.metrics,
	};
}
