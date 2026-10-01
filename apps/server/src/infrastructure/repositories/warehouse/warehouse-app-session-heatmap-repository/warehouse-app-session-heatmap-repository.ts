import type {
	AppSessionFilters,
	AppSessionHeatmapCellView,
	AppSessionHeatmapRepository,
} from "@market-health-map/core/application";
import type {
	WarehouseAppSessionFilterRow,
	WarehouseAppSessionHeatmapRow,
} from "@server/infrastructure/repositories/warehouse/warehouse-app-session-heatmap-repository/warehouse-app-session-heatmap-repository.types";
import type { WarehouseQueryable } from "@server/infrastructure/repositories/warehouse/warehouse-facility-repository/warehouse-facility-repository.types";

export const APP_SESSION_HEATMAP_LAST_28D_SQL = `
SELECT
  ROUND(lat::numeric, 3) AS lat,
  ROUND(lng::numeric, 3) AS lng,
  SUM(q_sessions)::bigint AS session_weight
FROM plei_gold.players_behaviour
WHERE date >= CURRENT_DATE - 28
  AND date < CURRENT_DATE
  AND lat IS NOT NULL
  AND lng IS NOT NULL
  AND NOT (ABS(lat) < 0.01 AND ABS(lng) < 0.01)
GROUP BY 1, 2`;

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
		const { rows } = await this.warehouse.query<WarehouseAppSessionFilterRow>(`
SELECT DISTINCT NULLIF(TRIM(gender), '') AS gender, NULLIF(TRIM(skill_description), '') AS skill
FROM plei_gold.dim_player
WHERE EXISTS (SELECT 1 FROM plei_gold.players_behaviour s WHERE s.player_id = dim_player.player_id AND s.date >= CURRENT_DATE - 28 AND s.date < CURRENT_DATE)`);
		return {
			genders: [...new Set(rows.flatMap((row) => (row.gender ? [row.gender] : [])))].sort(),
			skills: [...new Set(rows.flatMap((row) => (row.skill ? [row.skill] : [])))].sort(),
		};
	}

	async listLast28Days(filters: AppSessionFilters = {}): Promise<AppSessionHeatmapCellView[]> {
		const predicates: string[] = [];
		const values: unknown[] = [];
		for (const [column, value, operator] of [
			["NULLIF(TRIM(p.gender), '')", filters.gender, "="],
			["NULLIF(TRIM(p.skill_description), '')", filters.skill, "="],
			["p.age_integer", filters.ageMin, ">="],
			["p.age_integer", filters.ageMax, "<="],
		] as const) {
			if (value === undefined) continue;
			values.push(value);
			predicates.push(`${column} ${operator} $${values.length}`);
		}
		let sql = APP_SESSION_HEATMAP_LAST_28D_SQL;
		if (predicates.length) {
			sql = sql.replace(
				"GROUP BY 1, 2",
				`AND EXISTS (SELECT 1 FROM plei_gold.dim_player p WHERE p.player_id = players_behaviour.player_id AND ${predicates.join(" AND ")})\nGROUP BY 1, 2`,
			);
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
