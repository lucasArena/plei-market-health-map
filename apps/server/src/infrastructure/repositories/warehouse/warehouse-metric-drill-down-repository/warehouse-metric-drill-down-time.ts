import {
	DRILL_DOWN_MEASURE_KIND,
	DRILL_DOWN_RANGE_DAYS,
	type MetricDrillDownQuery,
	type MetricDrillDownView,
} from "@market-health-map/core/application";
import { GAME_DEPARTMENTS, statsWindow } from "@market-health-map/core/domain";
import type { WarehouseTimeRow } from "@server/infrastructure/repositories/warehouse/warehouse-metric-drill-down-repository/warehouse-metric-drill-down-repository.types";

function dateString(date: Date): string {
	return date.toISOString().slice(0, 10);
}
function calendarStart(day: string, grain: MetricDrillDownQuery["grain"]): string {
	const date = new Date(`${day}T00:00:00Z`);
	if (grain === "month") date.setUTCDate(1);
	if (grain === "week") date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
	return dateString(date);
}
function nextBucket(day: string, grain: MetricDrillDownQuery["grain"]): string {
	const date = new Date(`${day}T00:00:00Z`);
	if (grain === "month") date.setUTCMonth(date.getUTCMonth() + 1);
	else date.setUTCDate(date.getUTCDate() + (grain === "week" ? 7 : 1));
	return dateString(date);
}
function previousDay(day: string): string {
	const date = new Date(`${day}T00:00:00Z`);
	date.setUTCDate(date.getUTCDate() - 1);
	return dateString(date);
}
export function timeDrillDownWindow(query: MetricDrillDownQuery) {
	const { start } = statsWindow(query.today, DRILL_DOWN_RANGE_DAYS[query.range]);
	const until = calendarStart(query.today, query.grain);
	return { start, until, end: previousDay(until) };
}
export function timeDrillDownView(
	query: MetricDrillDownQuery,
	results: readonly WarehouseTimeRow[],
): MetricDrillDownView {
	const { start, until, end } = timeDrillDownWindow(query);
	const kind =
		query.measure === "active-facilities"
			? "distinct-count"
			: DRILL_DOWN_MEASURE_KIND[query.measure];
	const total = results.find((row) => row.is_total === 1 && row.department === null);
	const value = (row: WarehouseTimeRow | undefined) =>
		row?.value == null ? (kind === "rate" ? null : 0) : Number(row.value);
	const parts = (row: WarehouseTimeRow | undefined) =>
		kind === "rate"
			? {
					numerator: Number(row?.numerator ?? 0),
					denominator: Number(row?.denominator ?? 0),
					dataErrors: Number(row?.data_errors ?? 0),
				}
			: {};
	const byBucket = new Map(
		results
			.filter((row) => row.department === null && row.is_total === 0)
			.map((row) => [row.bucket, row]),
	);
	const departments = new Map(
		results
			.filter((row) => row.department !== null)
			.map((row) => [`${row.bucket}:${row.department}`, row]),
	);
	const rows: MetricDrillDownView["rows"] = [];
	for (
		let bucket = calendarStart(start, query.grain);
		bucket < until;
		bucket = nextBucket(bucket, query.grain)
	) {
		const row = byBucket.get(bucket);
		const bucketStart = bucket < start ? start : bucket;
		const bucketEnd = previousDay(nextBucket(bucket, query.grain));
		rows.push({
			id: bucket,
			name: bucket,
			bucketStart,
			bucketEnd,
			partial: bucket < start,
			value: value(row),
			...parts(row),
			facilityIds: row?.facility_ids ?? [],
			departmentFacilityIds: Object.fromEntries(
				GAME_DEPARTMENTS.map((dept) => [
					dept,
					departments.get(`${bucket}:${dept}`)?.facility_ids ?? [],
				]),
			),
			...(kind === "rate"
				? {
						departmentParts: Object.fromEntries(
							GAME_DEPARTMENTS.map((dept) => [dept, parts(departments.get(`${bucket}:${dept}`))]),
						),
					}
				: {}),
			departments:
				query.measure === "active-facilities" ||
				["app-sessions", "registrations", "unique-users"].includes(query.measure)
					? null
					: (Object.fromEntries(
							GAME_DEPARTMENTS.map((dept) => [dept, value(departments.get(`${bucket}:${dept}`))]),
						) as MetricDrillDownView["rows"][number]["departments"]),
		});
	}
	return {
		measure: query.measure,
		range: query.range,
		kind,
		start,
		end,
		rows,
		total: value(total),
		...parts(total),
	};
}
