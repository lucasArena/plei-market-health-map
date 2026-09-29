import { getFacilityDetailSchema } from "@core/application/dtos/facility-detail-dto";
import type {
	FacilityDetailView,
	GetFacilityDetailInput,
} from "@core/application/dtos/facility-detail-dto.types";
import { NotFoundError } from "@core/application/errors/use-case-error";
import { toFacilityPointView } from "@core/application/mappers/facility-mapper";
import { toFacilityStatsView } from "@core/application/mappers/facility-stats-mapper";
import type { GetFacilityDetailDeps } from "@core/application/use-cases/get-facility-detail.types";

export function makeGetFacilityDetail({ facilities, stats }: GetFacilityDetailDeps) {
	return async function getFacilityDetail(
		input: GetFacilityDetailInput,
	): Promise<FacilityDetailView> {
		const { facilityId } = getFacilityDetailSchema.parse(input);
		const facility = (await facilities.listAll()).find((item) => item.id === facilityId);
		if (!facility) throw new NotFoundError("Facility");

		const counts = await stats.getWeeklyCounts(facility.id);
		return {
			facility: { ...toFacilityPointView(facility), address: facility.toJSON().address },
			stats: toFacilityStatsView(counts),
		};
	};
}
