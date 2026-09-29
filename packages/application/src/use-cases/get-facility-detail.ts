import { getFacilityDetailSchema } from "@application/dtos/facility-detail-dto";
import type {
	FacilityDetailView,
	GetFacilityDetailInput,
} from "@application/dtos/facility-detail-dto.types";
import { NotFoundError } from "@application/errors/use-case-error";
import { toFacilityPointView } from "@application/mappers/facility-mapper";
import { toFacilityStatsView } from "@application/mappers/facility-stats-mapper";
import type { GetFacilityDetailDeps } from "@application/use-cases/get-facility-detail.types";
import { asEntityId } from "@market-health-map/domain";

export function makeGetFacilityDetail({ facilities, stats }: GetFacilityDetailDeps) {
	return async function getFacilityDetail(
		input: GetFacilityDetailInput,
	): Promise<FacilityDetailView> {
		const { facilityId } = getFacilityDetailSchema.parse(input);
		const facility = (await facilities.listAll()).find((item) =>
			item.memberIds.includes(asEntityId(facilityId)),
		);
		if (!facility) throw new NotFoundError("Facility");

		const counts = await stats.getWeeklyCounts(facility.memberIds);
		return {
			facility: { ...toFacilityPointView(facility), address: facility.toJSON().address },
			stats: toFacilityStatsView(counts),
		};
	};
}
