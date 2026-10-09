import {
	DRILL_DOWN_RANGE_DAYS,
	getMetricDrillDownSchema,
	isAppActivityMeasure,
} from "@core/application/dtos/metric-drill-down-dto";
import type {
	GetMetricDrillDownInput,
	MetricDrillDownView,
} from "@core/application/dtos/metric-drill-down-dto.types";
import { ForbiddenError } from "@core/application/errors/forbidden-error";
import { InvalidRequestError } from "@core/application/errors/invalid-request-error";
import type { MetricDrillDownQuery } from "@core/application/repositories/metric-drill-down-repository.types";
import type { GetMetricDrillDownDeps } from "@core/application/services/get-metric-drill-down.types";
import { statsToday } from "@core/application/services/stats-today";
import { statsWindow } from "@core/domain/shared/stats-day";

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
	rateFactParts,
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
		const query: MetricDrillDownQuery = {
			measure,
			range,
			slice: isAppActivityMeasure(measure) && slice !== "time" ? "market" : slice,
			marketId,
			facilityId: isAppActivityMeasure(measure) ? undefined : facilityId,
			department: isAppActivityMeasure(measure) ? undefined : department,
			departments: isAppActivityMeasure(measure) ? [] : departments,
			grain,
			today: statsToday(clock, timeZone),
		};
		const current = await drillDown.group(query);
		if (slice === "time") return current;
		const window = statsWindow(query.today, DRILL_DOWN_RANGE_DAYS[range]);
		const previous = await drillDown.group({ ...query, today: window.start, previousPeriod: true });
		const previousRows = new Map(previous.rows.map((row) => [row.id, row]));
		const currentIds = new Set(current.rows.map((row) => row.id));
		const rows = [
			...current.rows,
			...previous.rows
				.filter((row) => !currentIds.has(row.id))
				.map((row) => ({
					...row,
					value: current.total === null || current.kind === "rate" ? null : 0,
					departments:
						current.total !== null && current.kind !== "rate" && row.departments
							? { magic: 0, organizers: 0, partnerships: 0 }
							: null,
					numerator: current.kind === "rate" ? 0 : undefined,
					denominator: current.kind === "rate" ? 0 : undefined,
					dataErrors: undefined,
				})),
		];
		return {
			...current,
			previousTotal: previous.total,
			previousStart: window.previousStart,
			previousEnd: window.previousEnd,
			rows: rows.map((row) => {
				const prior = previousRows.get(row.id);
				return {
					...row,
					previousValue: prior
						? prior.value
						: previous.total === null || current.kind === "rate"
							? null
							: 0,
					previousDepartments: prior
						? prior.departments
						: previous.total !== null && current.kind !== "rate"
							? { magic: 0, organizers: 0, partnerships: 0 }
							: null,
				};
			}),
		};
	};
}
