import {
	DRILL_DOWN_RANGE_DAYS,
	getMetricDrillDownSchema,
	isAppActivityMeasure,
} from "@core/application/dtos/metric-drill-down-dto";
import type {
	GetMetricDrillDownInput,
	MetricDrillDownFacilitySegment,
	MetricDrillDownOrganizer,
	MetricDrillDownView,
} from "@core/application/dtos/metric-drill-down-dto.types";
import { InvalidRequestError } from "@core/application/errors/invalid-request-error";
import type { MetricDrillDownQuery } from "@core/application/repositories/metric-drill-down-repository.types";
import { toAverageDailyGamesView } from "@core/application/services/average-daily-games-view";
import { drillDownComparisonWindow } from "@core/application/services/drill-down-comparison-window";
import type { GetMetricDrillDownDeps } from "@core/application/services/get-metric-drill-down.types";
import { statsToday } from "@core/application/services/stats-today";
import { addDays } from "@core/domain/shared/eastern-calendar";

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
	organizerDisplayName,
	rateContributionsFromFacts,
	rateFactParts,
	rateValue,
	scheduledFactsFrom,
} from "@core/application/services/aggregate-metric-drill-down";

export function makeGetMetricDrillDown({ drillDown, clock }: GetMetricDrillDownDeps) {
	return async function getMetricDrillDown(
		input: GetMetricDrillDownInput,
	): Promise<MetricDrillDownView> {
		const parsed = getMetricDrillDownSchema.safeParse(input);
		if (!parsed.success) throw new InvalidRequestError(parsed.error.issues);
		const {
			comparison,
			measure,
			range,
			slice,
			segment,
			marketId,
			facilityId,
			department,
			departments,
			timeZone,
			grain,
		} = parsed.data;
		const isAverage = measure === "avg-daily-games";
		const finish = (view: MetricDrillDownView) =>
			isAverage ? toAverageDailyGamesView(view) : view;
		const query: MetricDrillDownQuery = {
			measure: isAverage ? "games" : measure,
			range,
			slice: isAppActivityMeasure(measure) && slice !== "time" ? "market" : slice,
			segment: isAppActivityMeasure(measure) ? "none" : segment,
			marketId,
			facilityId: isAppActivityMeasure(measure) ? undefined : facilityId,
			department: isAppActivityMeasure(measure) ? undefined : department,
			departments: isAppActivityMeasure(measure) ? [] : departments,
			grain,
			today: statsToday(clock, timeZone),
		};
		const current = finish(await drillDown.group(query));
		if (slice === "time") return withoutEmptyFacilities(current, slice);
		const window = drillDownComparisonWindow(query.today, DRILL_DOWN_RANGE_DAYS[range], comparison);
		const previous = finish(
			await drillDown.group({
				...query,
				today: addDays(window.end, 1),
				previousPeriod: true,
			}),
		);
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
					organizers: row.organizers?.map((organizer) => ({ ...organizer, value: 0 })) ?? null,
					facilities: row.facilities?.map((facility) => ({ ...facility, value: 0 })),
					numerator: current.kind === "rate" ? 0 : undefined,
					denominator: current.kind === "rate" ? 0 : undefined,
					dataErrors: undefined,
				})),
		];
		return withoutEmptyFacilities(
			{
				...current,
				previousTotal: previous.total,
				previousStart: window.start,
				previousEnd: window.end,
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
						organizers: withPreviousValues(
							row.organizers,
							prior?.organizers,
							previous.total,
							current.kind,
						),
						...(row.facilities !== undefined
							? {
									facilities: withPreviousValues(
										row.facilities,
										prior?.facilities,
										previous.total,
										current.kind,
									),
								}
							: {}),
					};
				}),
			},
			slice,
		);
	};
}

export function hasDrillDownValue(value: number | null | undefined): boolean {
	return value != null && value !== 0;
}

/**
 * Facilities with no value for the selected measure (null or 0) add nothing to the chart or the
 * table, so they are dropped from Facility slices and Facility segments. Totals are untouched.
 */
export function withoutEmptyFacilities(
	view: MetricDrillDownView,
	slice: MetricDrillDownQuery["slice"],
): MetricDrillDownView {
	const rows =
		slice === "facility" ? view.rows.filter((row) => hasDrillDownValue(row.value)) : view.rows;
	return {
		...view,
		rows: rows.map((row) =>
			row.facilities
				? {
						...row,
						facilities: row.facilities.filter((facility) => hasDrillDownValue(facility.value)),
					}
				: row,
		),
	};
}

function withPreviousValues<
	Group extends MetricDrillDownOrganizer | MetricDrillDownFacilitySegment,
>(
	current: Group[] | null | undefined,
	prior: Group[] | null | undefined,
	previousTotal: number | null | undefined,
	kind: MetricDrillDownView["kind"],
): Group[] | null | undefined {
	if (!current) return current;
	const previousById = new Map((prior ?? []).map((group) => [group.id, group]));
	const missing = previousTotal === null || kind === "rate" ? null : 0;
	return current.map((group) => ({
		...group,
		previousValue: previousById.get(group.id)?.value ?? missing,
	}));
}
