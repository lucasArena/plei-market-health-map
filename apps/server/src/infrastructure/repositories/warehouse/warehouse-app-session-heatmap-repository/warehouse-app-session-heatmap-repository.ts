import {
	type AppSessionFilters,
	type AppSessionHeatmapCellView,
	type AppSessionHeatmapRepository,
	STATS_PERIOD_DAYS,
	type StatsPeriod,
} from "@market-health-map/core/application";
import { addDays } from "@market-health-map/core/domain";
import type {
	WarehouseAppSessionFilterRow,
	WarehouseAppSessionHeatmapRow,
} from "@server/infrastructure/repositories/warehouse/warehouse-app-session-heatmap-repository/warehouse-app-session-heatmap-repository.types";
import type { WarehouseQueryable } from "@server/infrastructure/repositories/warehouse/warehouse-facility-repository/warehouse-facility-repository.types";

export const APP_SESSION_FILTER_OPTIONS_SQL = `
SELECT DISTINCT NULLIF(TRIM(gender::text), '') AS gender,
  NULLIF(TRIM(skill_description::text), '') AS skill, age_integer AS age
FROM plei_gold.dim_player
WHERE EXISTS (SELECT 1 FROM plei_gold.players_behaviour s WHERE s.player_id = dim_player.player_id AND s.date >= CURRENT_DATE - 28 AND s.date < CURRENT_DATE)
  OR (confirmed_at >= CURRENT_DATE - 28 AND confirmed_at < CURRENT_DATE AND players_type = 'pleiapp_player')`;

/**
 * `[start, end)` for the period's full days ending the day before the viewer's `today`; the
 * end bound is today itself, so today is never included.
 */
export function sessionWindow(period: StatsPeriod, today: string): [start: string, end: string] {
	return [addDays(today, -STATS_PERIOD_DAYS[period]), today];
}

export const APP_SESSION_HEATMAP_SQL = `
SELECT
  ROUND(lat::numeric, 3) AS lat,
  ROUND(lng::numeric, 3) AS lng,
  SUM(q_sessions)::bigint AS session_weight
FROM plei_gold.players_behaviour
WHERE date >= $1::date
  AND date < $2::date
  AND lat IS NOT NULL
  AND lng IS NOT NULL
  AND NOT (ABS(lat) < 0.01 AND ABS(lng) < 0.01)
GROUP BY 1, 2`;

/** `$1` holds the viewer's today: registrations in the 28 full days ending the day before. */
export const REGISTRATION_HEATMAP_LAST_28D_SQL = `
WITH region_coordinates AS (
  SELECT region_id,
    percentile_cont(0.5) WITHIN GROUP (ORDER BY location_latitude) AS lat,
    percentile_cont(0.5) WITHIN GROUP (ORDER BY location_longitude) AS lng
  FROM plei_gold.dim_location
  WHERE location_latitude BETWEEN -90 AND 90
    AND location_longitude BETWEEN -180 AND 180
    AND NOT (ABS(location_latitude) < 0.01 AND ABS(location_longitude) < 0.01)
  GROUP BY region_id
)
SELECT c.lat, c.lng, COUNT(DISTINCT p.player_id)::bigint AS session_weight
FROM plei_gold.dim_player p
JOIN region_coordinates c ON c.region_id = p.region_id
WHERE p.confirmed_at >= $1::date - 28
  AND p.confirmed_at < $1::date
  AND p.players_type = 'pleiapp_player'
GROUP BY c.lat, c.lng`;

export function toAppSessionHeatmapCell(
	row: WarehouseAppSessionHeatmapRow,
): AppSessionHeatmapCellView | null {
	if (row.lat == null || row.lng == null || row.session_weight == null) return null;
	const lat = Number(row.lat);
	const lng = Number(row.lng);
	const sessionWeight = Number(row.session_weight);
	if (!Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(sessionWeight)) {
		return null;
	}
	if (sessionWeight <= 0) return null;
	return { lat, lng, sessionWeight };
}

export class WarehouseAppSessionHeatmapRepository implements AppSessionHeatmapRepository {
	constructor(private readonly warehouse: WarehouseQueryable) {}

	async listFilterOptions() {
		const { rows } = await this.warehouse.query<WarehouseAppSessionFilterRow>(
			APP_SESSION_FILTER_OPTIONS_SQL,
		);
		return {
			ages: [
				...new Set(
					rows.flatMap((row) => {
						const age = row.age === null ? NaN : Number(row.age);
						return Number.isInteger(age) && age >= 0 && age <= 120 ? [age] : [];
					}),
				),
			].sort((a, b) => a - b),
			genders: [...new Set(rows.flatMap((row) => (row.gender ? [row.gender] : [])))].sort(),
			skills: [...new Set(rows.flatMap((row) => (row.skill ? [row.skill] : [])))].sort(),
		};
	}

	async listSessions(
		period: StatsPeriod,
		filters: AppSessionFilters,
		today: string,
	): Promise<AppSessionHeatmapCellView[]> {
		const isRegistrations = filters.metric === "registrations";
		const predicates: string[] = [];
		const values: unknown[] = isRegistrations ? [today] : sessionWindow(period, today);
		for (const [column, value, operator] of [
			["NULLIF(TRIM(p.gender::text), '')", filters.gender, "="],
			["NULLIF(TRIM(p.skill_description::text), '')", filters.skill, "="],
			["p.age_integer", filters.ageMin, ">="],
			["p.age_integer", filters.ageMax, "<="],
		] as const) {
			if (value === undefined) continue;
			values.push(value);
			predicates.push(
				Array.isArray(value)
					? `${column} = ANY($${values.length}::text[])`
					: `${column} ${operator} $${values.length}`,
			);
		}
		let sql = isRegistrations ? REGISTRATION_HEATMAP_LAST_28D_SQL : APP_SESSION_HEATMAP_SQL;
		if (predicates.length) {
			if (isRegistrations) {
				sql = sql.replace(
					"GROUP BY c.lat, c.lng",
					`AND ${predicates.join(" AND ")}\nGROUP BY c.lat, c.lng`,
				);
			} else {
				sql = sql.replace(
					"GROUP BY 1, 2",
					`AND EXISTS (SELECT 1 FROM plei_gold.dim_player p WHERE p.player_id = players_behaviour.player_id AND ${predicates.join(" AND ")})\nGROUP BY 1, 2`,
				);
			}
		}
		const result = values.length
			? await this.warehouse.query<WarehouseAppSessionHeatmapRow>(sql, values)
			: await this.warehouse.query<WarehouseAppSessionHeatmapRow>(sql);
		const { rows } = result;
		return rows.flatMap((row) => {
			const cell = toAppSessionHeatmapCell(row);
			return cell ? [cell] : [];
		});
	}
}
