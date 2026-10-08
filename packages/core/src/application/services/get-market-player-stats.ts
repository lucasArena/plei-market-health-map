import { getMarketPlayerStatsSchema } from "@core/application/dtos/market-summary-dto";
import type {
	GetMarketPlayerStatsInput,
	MarketPlayerStatsView,
} from "@core/application/dtos/market-summary-dto.types";
import { InvalidRequestError } from "@core/application/errors/invalid-request-error";
import { toFacilityPlayerStatsView } from "@core/application/mappers/facility-stats-mapper";
import {
	selectMarketFacilities,
	toMarketMemberIds,
} from "@core/application/mappers/market-summary-mapper";
import type { GetMarketPlayerStatsDeps } from "@core/application/services/get-market-player-stats.types";

export function makeGetMarketPlayerStats({ facilities, stats }: GetMarketPlayerStatsDeps) {
	return async function getMarketPlayerStats(
		input: GetMarketPlayerStatsInput = {},
	): Promise<MarketPlayerStatsView> {
		const parsed = getMarketPlayerStatsSchema.safeParse(input);
		if (!parsed.success) throw new InvalidRequestError(parsed.error.issues);
		const visible = selectMarketFacilities(await facilities.listAll(), parsed.data.market);
		return toFacilityPlayerStatsView(await stats.getPlayerStats(toMarketMemberIds(visible)));
	};
}
