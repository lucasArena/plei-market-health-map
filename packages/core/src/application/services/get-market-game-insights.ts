import { getMarketGameInsightsSchema } from "@core/application/dtos/market-summary-dto";
import type {
	GetMarketGameInsightsInput,
	MarketGameChangeView,
} from "@core/application/dtos/market-summary-dto.types";
import { InvalidRequestError } from "@core/application/errors/invalid-request-error";
import {
	toDepartmentGameComparisons,
	toMarketGameChanges,
} from "@core/application/mappers/market-game-changes";
import {
	selectMarketFacilities,
	toMarketMemberIds,
} from "@core/application/mappers/market-summary-mapper";
import type { GetMarketGameInsightsDeps } from "@core/application/services/get-market-game-insights.types";
import { statsToday } from "@core/application/services/stats-today";

export function makeGetMarketGameInsights({ facilities, stats, clock }: GetMarketGameInsightsDeps) {
	return async function getMarketGameInsights(
		input: GetMarketGameInsightsInput = {},
	): Promise<MarketGameChangeView[]> {
		const parsed = getMarketGameInsightsSchema.safeParse(input);
		if (!parsed.success) throw new InvalidRequestError(parsed.error.issues);
		const { departments, market, period, timeZone } = parsed.data;
		const today = statsToday(clock, timeZone);
		const visible = selectMarketFacilities(await facilities.listAll(today), market);
		const comparisons =
			departments.length > 0
				? toDepartmentGameComparisons(visible, departments)
				: await stats.getGameComparisons(toMarketMemberIds(visible), today);
		return toMarketGameChanges(visible, comparisons, period);
	};
}
