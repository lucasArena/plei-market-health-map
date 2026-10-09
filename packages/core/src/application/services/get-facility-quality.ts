import { getFacilityQualitySchema } from "@core/application/dtos/facility-quality-dto";
import type {
	FacilityQualityView,
	GetFacilityQualityInput,
} from "@core/application/dtos/facility-quality-dto.types";
import { NotFoundError } from "@core/application/errors/not-found-error";
import { toFacilityQualityView } from "@core/application/mappers/facility-quality-mapper";
import type { GetFacilityQualityDeps } from "@core/application/services/get-facility-quality.types";
import { statsToday } from "@core/application/services/stats-today";
import { asEntityId } from "@core/domain";

export function makeGetFacilityQuality({ facilities, quality, clock }: GetFacilityQualityDeps) {
	return async function getFacilityQuality(
		input: GetFacilityQualityInput,
	): Promise<FacilityQualityView> {
		const { facilityId, timeZone } = getFacilityQualitySchema.parse(input);
		const today = statsToday(clock, timeZone);
		const facility = (await facilities.listAll(today)).find((item) =>
			item.memberIds.includes(asEntityId(facilityId)),
		);
		if (!facility) throw new NotFoundError("Facility");
		return toFacilityQualityView(await quality.getQuality(facility.memberIds, today));
	};
}
