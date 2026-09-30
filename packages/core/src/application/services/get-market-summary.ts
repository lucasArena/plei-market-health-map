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
	toMarketSummaryScope,
	toTopFacilities,
	toTopMarkets,
} from "@core/application/mappers/market-summary-mapper";
import type { GetMarketSummaryDeps } from "@core/application/services/get-market-summary.types";

export function makeGetMarketSummary({ facilities, stats }: GetMarketSummaryDeps) {
	return async function getMarketSummary(
		input: GetMarketSummaryInput = {},
	): Promise<MarketSummaryView> {
		const parsed = getMarketSummarySchema.safeParse(input);
		if (!parsed.success) throw new InvalidRequestError(parsed.error.issues);
		const visible = selectMarketFacilities(await facilities.listAll(), parsed.data.market);
		const reservationStats = await stats.getReservationStats(toMarketMemberIds(visible));
		return {
			scope: toMarketSummaryScope(visible),
			stats: toFacilityReservationStatsView(reservationStats),
			topFacilities: toTopFacilities(visible),
			topMarkets: toTopMarkets(visible),
		};
	};
}
