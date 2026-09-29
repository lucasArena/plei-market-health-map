import type { FacilityPointView } from "@core/application/dtos/facility-dto.types";
import { toFacilityPointView } from "@core/application/mappers/facility-mapper";
import type { ListFacilitiesDeps } from "@core/application/use-cases/list-facilities.types";

export function makeListFacilities({ facilities }: ListFacilitiesDeps) {
	return async function listFacilities(): Promise<FacilityPointView[]> {
		const all = await facilities.listAll();
		return all.map(toFacilityPointView);
	};
}
