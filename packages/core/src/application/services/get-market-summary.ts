import { getMarketSummarySchema } from "@core/application/dtos/market-summary-dto";
import type {
	GetMarketSummaryInput,
	MarketSummaryView,
} from "@core/application/dtos/market-summary-dto.types";
import { InvalidRequestError } from "@core/application/errors/invalid-request-error";
import { toFacilityReservationStatsView } from "@core/application/mappers/facility-stats-mapper";
import {
	selectMarketFacilities,
	toMarketMemberIds,
	toMarketSummaryPeriod,
} from "@core/application/mappers/market-summary-mapper";
import type { GetMarketSummaryDeps } from "@core/application/services/get-market-summary.types";

export function makeGetMarketSummary({ facilities, stats }: GetMarketSummaryDeps) {
	return async function getMarketSummary(
		input: GetMarketSummaryInput = {},
	): Promise<MarketSummaryView> {
		const parsed = getMarketSummarySchema.safeParse(input);
		if (!parsed.success) throw new InvalidRequestError(parsed.error.issues);
		const { departments, market } = parsed.data;
		const visible = selectMarketFacilities(await facilities.listAll(), market);
		const memberIds = toMarketMemberIds(visible);
		const reservationStats = await (departments.length > 0
			? stats.getReservationStats(memberIds, { departments })
			: stats.getReservationStats(memberIds));
		return {
			stats: toFacilityReservationStatsView(reservationStats),
			periods: {
				week: toMarketSummaryPeriod(visible, "week", departments),
				month: toMarketSummaryPeriod(visible, "month", departments),
			},
		};
	};
}
