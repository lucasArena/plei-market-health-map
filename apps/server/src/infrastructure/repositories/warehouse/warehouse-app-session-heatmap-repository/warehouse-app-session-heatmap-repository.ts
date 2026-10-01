import type {
	AppSessionHeatmapCellView,
	AppSessionHeatmapRepository,
} from "@market-health-map/core/application";
import type { WarehouseAppSessionHeatmapRow } from "@server/infrastructure/repositories/warehouse/warehouse-app-session-heatmap-repository/warehouse-app-session-heatmap-repository.types";
import type { WarehouseQueryable } from "@server/infrastructure/repositories/warehouse/warehouse-facility-repository/warehouse-facility-repository.types";

export const APP_SESSION_HEATMAP_LAST_28D_SQL = `
WITH session_counts AS (
  SELECT
    plei_region,
    SUM(q_sessions)::bigint AS session_weight
  FROM plei_gold.players_behaviour
  WHERE date >= CURRENT_DATE - 28
    AND date < CURRENT_DATE
  GROUP BY plei_region
),
region_centers AS (
  SELECT
    r.region_name,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY l.location_latitude) AS lat,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY l.location_longitude) AS lng
  FROM plei_gold.dim_region r
  INNER JOIN plei_gold.dim_location l USING (region_id)
  WHERE l.deleted_at IS NULL
    AND l.location_latitude IS NOT NULL
    AND l.location_longitude IS NOT NULL
    AND NOT (ABS(l.location_latitude) < 0.01 AND ABS(l.location_longitude) < 0.01)
  GROUP BY r.region_name
)
SELECT
  ROUND(c.lat::numeric, 3) AS lat,
  ROUND(c.lng::numeric, 3) AS lng,
  s.session_weight
FROM session_counts s
INNER JOIN region_centers c ON c.region_name = s.plei_region`;

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

	async listLast28Days(): Promise<AppSessionHeatmapCellView[]> {
		const { rows } = await this.warehouse.query<WarehouseAppSessionHeatmapRow>(
			APP_SESSION_HEATMAP_LAST_28D_SQL,
		);
		return rows.flatMap((row) => {
			const cell = toAppSessionHeatmapCell(row);
			return cell ? [cell] : [];
		});
	}
}
