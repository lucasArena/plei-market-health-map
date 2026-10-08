import { getFacilityDetailSchema } from "@core/application/dtos/facility-detail-dto";
import type {
	FacilityReservationDetailView,
	GetFacilityReservationStatsInput,
} from "@core/application/dtos/facility-detail-dto.types";
import { NotFoundError } from "@core/application/errors/not-found-error";
import { toFacilityPointView } from "@core/application/mappers/facility-mapper";
import { toFacilityReservationStatsView } from "@core/application/mappers/facility-stats-mapper";
import type { GetFacilityReservationStatsDeps } from "@core/application/services/get-facility-reservation-stats.types";
import { statsToday } from "@core/application/services/stats-today";
import { asEntityId } from "@core/domain";

export function makeGetFacilityReservationStats({
	facilities,
	stats,
	clock,
}: GetFacilityReservationStatsDeps) {
	return async function getFacilityReservationStats(
		input: GetFacilityReservationStatsInput,
	): Promise<FacilityReservationDetailView> {
		const { facilityId, timeZone } = getFacilityDetailSchema.parse(input);
		const today = statsToday(clock, timeZone);
		const facility = (await facilities.listAll(today)).find((item) =>
			item.memberIds.includes(asEntityId(facilityId)),
		);
		if (!facility) throw new NotFoundError("Facility");
		return {
			facility: { ...toFacilityPointView(facility), address: facility.toJSON().address },
			stats: toFacilityReservationStatsView(
				await stats.getReservationStats(facility.memberIds, today),
			),
		};
	};
}
