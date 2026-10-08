import { getFacilityDetailSchema } from "@core/application/dtos/facility-detail-dto";
import type {
	FacilityDetailView,
	GetFacilityDetailInput,
} from "@core/application/dtos/facility-detail-dto.types";
import { NotFoundError } from "@core/application/errors/not-found-error";
import { toFacilityPointView } from "@core/application/mappers/facility-mapper";
import { toFacilityStatsView } from "@core/application/mappers/facility-stats-mapper";
import type { GetFacilityDetailDeps } from "@core/application/services/get-facility-detail.types";
import { statsToday } from "@core/application/services/stats-today";
import { asEntityId } from "@core/domain";

export function makeGetFacilityDetail({ facilities, stats, clock }: GetFacilityDetailDeps) {
	return async function getFacilityDetail(
		input: GetFacilityDetailInput,
	): Promise<FacilityDetailView> {
		const { facilityId, timeZone } = getFacilityDetailSchema.parse(input);
		const today = statsToday(clock, timeZone);
		const facility = (await facilities.listAll(today)).find((item) =>
			item.memberIds.includes(asEntityId(facilityId)),
		);
		if (!facility) throw new NotFoundError("Facility");

		const [reservationStats, playerStats] = await Promise.all([
			stats.getReservationStats(facility.memberIds, today),
			stats.getPlayerStats(facility.memberIds, today),
		]);
		return {
			facility: { ...toFacilityPointView(facility), address: facility.toJSON().address },
			stats: toFacilityStatsView({ ...reservationStats, ...playerStats }),
		};
	};
}
