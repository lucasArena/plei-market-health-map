import type {
	RegistrationHeatmapCellView,
	RegistrationHeatmapRepository,
} from "@market-health-map/core/application";
import type { WarehouseQueryable } from "@server/infrastructure/repositories/warehouse/warehouse-facility-repository/warehouse-facility-repository.types";
import type { WarehouseRegistrationHeatmapRow } from "@server/infrastructure/repositories/warehouse/warehouse-registration-heatmap-repository/warehouse-registration-heatmap-repository.types";

export const REGISTRATION_HEATMAP_LAST_28D_SQL = `
WITH registration_counts AS (
  SELECT
    region_id,
    COUNT(DISTINCT player_id)::bigint AS registration_weight
  FROM plei_gold.dim_player
  WHERE confirmed_at >= CURRENT_DATE - 28
    AND confirmed_at < CURRENT_DATE
    AND players_type = 'pleiapp_player'
  GROUP BY region_id
),
region_centers AS (
  SELECT
    region_id,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY location_latitude) AS lat,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY location_longitude) AS lng
  FROM plei_gold.dim_location
  WHERE deleted_at IS NULL
    AND location_latitude IS NOT NULL
    AND location_longitude IS NOT NULL
    AND NOT (ABS(location_latitude) < 0.01 AND ABS(location_longitude) < 0.01)
  GROUP BY region_id
)
SELECT
  ROUND(c.lat::numeric, 3) AS lat,
  ROUND(c.lng::numeric, 3) AS lng,
  r.registration_weight
FROM registration_counts r
INNER JOIN region_centers c USING (region_id)`;

export function toRegistrationHeatmapCell(
	row: WarehouseRegistrationHeatmapRow,
): RegistrationHeatmapCellView | null {
	if (row.lat == null || row.lng == null || row.registration_weight == null) return null;
	const lat = Number(row.lat);
	const lng = Number(row.lng);
	const registrationWeight = Number(row.registration_weight);
	if (!Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(registrationWeight)) {
		return null;
	}
	if (registrationWeight <= 0) return null;
	return { lat, lng, registrationWeight };
}

export class WarehouseRegistrationHeatmapRepository implements RegistrationHeatmapRepository {
	constructor(private readonly warehouse: WarehouseQueryable) {}

	async listLast28Days(): Promise<RegistrationHeatmapCellView[]> {
		const { rows } = await this.warehouse.query<WarehouseRegistrationHeatmapRow>(
			REGISTRATION_HEATMAP_LAST_28D_SQL,
		);
		return rows.flatMap((row) => {
			const cell = toRegistrationHeatmapCell(row);
			return cell ? [cell] : [];
		});
	}
}
