import type { FacilityPointView } from "@core/application/dtos/facility-dto.types";
import { toFacilityPointView } from "@core/application/mappers/facility-mapper";
import type { ListFacilitiesDeps } from "@core/application/services/list-facilities.types";
import { statsToday } from "@core/application/services/stats-today";

export function makeListFacilities({ facilities, clock }: ListFacilitiesDeps) {
	return async function listFacilities(
		input: { timeZone?: string } = {},
	): Promise<FacilityPointView[]> {
		const all = await facilities.listAll(statsToday(clock, input.timeZone));
		return all.map(toFacilityPointView);
	};
}
