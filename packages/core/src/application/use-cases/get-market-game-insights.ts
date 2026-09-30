import { getMarketSummarySchema } from "@core/application/dtos/market-summary-dto";
import type {
	GetMarketSummaryInput,
	MarketGameChangeView,
} from "@core/application/dtos/market-summary-dto.types";
import { InvalidRequestError } from "@core/application/errors/invalid-request-error";
import { toMarketGameChanges } from "@core/application/mappers/market-game-changes";
import {
	selectMarketFacilities,
	toMarketMemberIds,
} from "@core/application/mappers/market-summary-mapper";
import type { GetMarketGameInsightsDeps } from "@core/application/use-cases/get-market-game-insights.types";

export function makeGetMarketGameInsights({ facilities, stats }: GetMarketGameInsightsDeps) {
	return async function getMarketGameInsights(
		input: GetMarketSummaryInput = {},
	): Promise<MarketGameChangeView[]> {
		const parsed = getMarketSummarySchema.safeParse(input);
		if (!parsed.success) throw new InvalidRequestError(parsed.error.issues);
		const visible = selectMarketFacilities(await facilities.listAll(), parsed.data.market);
		const comparisons = await stats.getGameComparisons(toMarketMemberIds(visible));
		return toMarketGameChanges(visible, comparisons);
	};
}
