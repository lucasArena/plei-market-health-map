import { getMetricDrillDownSchema } from "@core/application/dtos/metric-drill-down-dto";
import type {
	GetMetricDrillDownInput,
	MetricDrillDownView,
} from "@core/application/dtos/metric-drill-down-dto.types";
import { ForbiddenError } from "@core/application/errors/forbidden-error";
import { InvalidRequestError } from "@core/application/errors/invalid-request-error";
import type { GetMetricDrillDownDeps } from "@core/application/services/get-metric-drill-down.types";
import { statsToday } from "@core/application/services/stats-today";

export {
	aggregateCountDrillDown,
	aggregateDistinctCountDrillDown,
	aggregateDrillDownFromFacts,
	aggregateRateDrillDown,
	DRILL_DOWN_DEPARTMENTS,
	distinctContributionsFromFacts,
	drillDownRangeDays,
	drillDownWindow,
	factsFromFacilityPoints,
	measureRateValue,
	rateContributionsFromFacts,
	rateValue,
	scheduledFactsFrom,
} from "@core/application/services/aggregate-metric-drill-down";

export function makeGetMetricDrillDown({
	drillDown,
	clock,
	enabledFeatureFlags,
}: GetMetricDrillDownDeps) {
	return async function getMetricDrillDown(
		input: GetMetricDrillDownInput,
	): Promise<MetricDrillDownView> {
		const parsed = getMetricDrillDownSchema.safeParse(input);
		if (!parsed.success) throw new InvalidRequestError(parsed.error.issues);
		const { enabled } = await enabledFeatureFlags();
		if (!enabled.includes("metric-drill-down")) throw new ForbiddenError("metric drill-down");
		const {
			measure,
			range,
			slice,
			marketId,
			facilityId,
			department,
			departments,
			timeZone,
			grain,
		} = parsed.data;
		return drillDown.group({
			measure,
			range,
			slice,
			marketId,
			facilityId,
			department,
			departments,
			grain,
			today: statsToday(clock, timeZone),
		});
	};
}
