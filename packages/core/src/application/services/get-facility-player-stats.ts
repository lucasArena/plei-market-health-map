import { getFacilityDetailSchema } from "@core/application/dtos/facility-detail-dto";
import type {
	FacilityPlayerStatsView,
	GetFacilityPlayerStatsInput,
} from "@core/application/dtos/facility-detail-dto.types";
import { NotFoundError } from "@core/application/errors/not-found-error";
import { toFacilityPlayerStatsView } from "@core/application/mappers/facility-stats-mapper";
import type { GetFacilityPlayerStatsDeps } from "@core/application/services/get-facility-player-stats.types";
import { asEntityId } from "@core/domain";

export function makeGetFacilityPlayerStats({ facilities, stats }: GetFacilityPlayerStatsDeps) {
	return async function getFacilityPlayerStats(
		input: GetFacilityPlayerStatsInput,
	): Promise<FacilityPlayerStatsView> {
		const { facilityId } = getFacilityDetailSchema.parse(input);
		const facility = (await facilities.listAll()).find((item) =>
			item.memberIds.includes(asEntityId(facilityId)),
		);
		if (!facility) throw new NotFoundError("Facility");
		return toFacilityPlayerStatsView(await stats.getPlayerStats(facility.memberIds));
	};
}
