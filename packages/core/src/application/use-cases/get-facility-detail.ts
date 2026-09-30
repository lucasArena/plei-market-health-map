import { getFacilityDetailSchema } from "@core/application/dtos/facility-detail-dto";
import type {
	FacilityDetailView,
	GetFacilityDetailInput,
} from "@core/application/dtos/facility-detail-dto.types";
import { NotFoundError } from "@core/application/errors/not-found-error";
import { toFacilityPointView } from "@core/application/mappers/facility-mapper";
import { toFacilityStatsView } from "@core/application/mappers/facility-stats-mapper";
import type { GetFacilityDetailDeps } from "@core/application/use-cases/get-facility-detail.types";
import { asEntityId } from "@core/domain";

export function makeGetFacilityDetail({ facilities, stats }: GetFacilityDetailDeps) {
	return async function getFacilityDetail(
		input: GetFacilityDetailInput,
	): Promise<FacilityDetailView> {
		const { facilityId } = getFacilityDetailSchema.parse(input);
		const facility = (await facilities.listAll()).find((item) =>
			item.memberIds.includes(asEntityId(facilityId)),
		);
		if (!facility) throw new NotFoundError("Facility");

		const [reservationStats, playerStats] = await Promise.all([
			stats.getReservationStats(facility.memberIds),
			stats.getPlayerStats(facility.memberIds),
		]);
		return {
			facility: { ...toFacilityPointView(facility), address: facility.toJSON().address },
			stats: toFacilityStatsView({ ...reservationStats, ...playerStats }),
		};
	};
}
