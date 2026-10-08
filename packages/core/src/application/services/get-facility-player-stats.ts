import { getFacilityDetailSchema } from "@core/application/dtos/facility-detail-dto";
import type {
	FacilityPlayerStatsView,
	GetFacilityPlayerStatsInput,
} from "@core/application/dtos/facility-detail-dto.types";
import { NotFoundError } from "@core/application/errors/not-found-error";
import { toFacilityPlayerStatsView } from "@core/application/mappers/facility-stats-mapper";
import type { GetFacilityPlayerStatsDeps } from "@core/application/services/get-facility-player-stats.types";
import { statsToday } from "@core/application/services/stats-today";
import { asEntityId } from "@core/domain";

export function makeGetFacilityPlayerStats({
	facilities,
	stats,
	clock,
}: GetFacilityPlayerStatsDeps) {
	return async function getFacilityPlayerStats(
		input: GetFacilityPlayerStatsInput,
	): Promise<FacilityPlayerStatsView> {
		const { facilityId, timeZone } = getFacilityDetailSchema.parse(input);
		const today = statsToday(clock, timeZone);
		const facility = (await facilities.listAll(today)).find((item) =>
			item.memberIds.includes(asEntityId(facilityId)),
		);
		if (!facility) throw new NotFoundError("Facility");
		return toFacilityPlayerStatsView(await stats.getPlayerStats(facility.memberIds, today));
	};
}
