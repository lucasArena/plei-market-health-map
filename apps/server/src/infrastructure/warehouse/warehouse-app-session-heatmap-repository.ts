import type {
	AppSessionHeatmapCellView,
	AppSessionHeatmapRepository,
} from "@market-health-map/core/application";
import type { WarehouseAppSessionHeatmapRow } from "@server/infrastructure/warehouse/warehouse-app-session-heatmap.types";
import type { WarehouseQueryable } from "@server/infrastructure/warehouse/warehouse-facility.types";

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
