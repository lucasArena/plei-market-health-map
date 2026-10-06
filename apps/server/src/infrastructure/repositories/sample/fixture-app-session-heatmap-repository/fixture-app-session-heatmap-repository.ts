import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type {
	AppSessionFilters,
	AppSessionHeatmapCellView,
	AppSessionHeatmapRepository,
	StatsPeriod,
} from "@market-health-map/core/application";

export const DEFAULT_APP_SESSION_HEATMAP_FIXTURE_PATH = join(
	dirname(fileURLToPath(import.meta.url)),
	"fixtures",
	"app-session-heatmap-last28d.csv",
);

export function parseAppSessionHeatmapCsv(csv: string): AppSessionHeatmapCellView[] {
	const lines = csv.split(/\r?\n/).filter((line) => line.length > 0);
	if (lines.length < 2) return [];
	const header = lines[0]?.split(",") ?? [];
	const latIdx = header.indexOf("lat");
	const lngIdx = header.indexOf("lng");
	const weightIdx = header.indexOf("session_weight");
	if (latIdx < 0 || lngIdx < 0 || weightIdx < 0) return [];

	const cells: AppSessionHeatmapCellView[] = [];
	for (let i = 1; i < lines.length; i += 1) {
		const cols = lines[i]?.split(",") ?? [];
		const lat = Number(cols[latIdx]);
		const lng = Number(cols[lngIdx]);
		const sessionWeight = Number(cols[weightIdx]);
		if (!Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(sessionWeight)) {
			continue;
		}
		if (sessionWeight <= 0) continue;
		cells.push({ lat, lng, sessionWeight });
	}
	return cells;
}

export class FixtureAppSessionHeatmapRepository implements AppSessionHeatmapRepository {
	private cells: AppSessionHeatmapCellView[] | null = null;

	constructor(private readonly fixturePath: string = DEFAULT_APP_SESSION_HEATMAP_FIXTURE_PATH) {}

	async listFilterOptions() {
		return { genders: [], skills: [], ages: [] };
	}

	async listSessions(
		_period: StatsPeriod,
		filters: AppSessionFilters = {},
	): Promise<AppSessionHeatmapCellView[]> {
		if (Object.keys(filters).length) return [];
		this.cells ??= parseAppSessionHeatmapCsv(readFileSync(this.fixturePath, "utf8"));
		return [...this.cells];
	}
}
