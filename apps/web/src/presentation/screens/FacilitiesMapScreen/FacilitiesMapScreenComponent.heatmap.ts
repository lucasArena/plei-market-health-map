import type { AppSessionFilters } from "@market-health-map/core/application";
import type { AppSessionHeatmapCellView } from "@/presentation/hooks/use-app/use-app-session-heatmap";
import type {
	AppSessionHeatmapFeatureCollection,
	SessionHeatmapArea,
	SessionHeatmapBounds,
	SessionHeatmapScale,
	SessionLegendFilterChip,
} from "@/presentation/screens/FacilitiesMapScreen/FacilitiesMapScreenComponent.types";

export function toAppSessionHeatmapFeatureCollection(
	cells: AppSessionHeatmapCellView[],
	bounds?: SessionHeatmapBounds,
): AppSessionHeatmapFeatureCollection {
	const visibleCells = bounds
		? cells.filter((cell) => bounds.contains([cell.lng, cell.lat]))
		: cells;
	const sortedWeights = visibleCells
		.map((cell) => cell.sessionWeight)
		.filter((weight) => weight > 0)
		.sort((a, b) => a - b);
	const localCeiling = sortedWeights[Math.ceil((sortedWeights.length - 1) * 0.9)] ?? 1;
	return {
		type: "FeatureCollection",
		features: visibleCells.map((cell) => ({
			type: "Feature",
			geometry: {
				type: "Point",
				coordinates: [cell.lng, cell.lat],
			},
			properties: {
				sessionWeight: cell.sessionWeight,
				intensity: Math.min(1, Math.max(0.01, (cell.sessionWeight / localCeiling) ** 0.8)),
			},
		})),
	};
}

export function appSessionHeatmapAreas(
	cells: AppSessionHeatmapCellView[],
	bounds?: SessionHeatmapBounds,
): SessionHeatmapArea[] {
	const visibleCells = bounds
		? cells.filter((cell) => bounds.contains([cell.lng, cell.lat]))
		: cells;
	const west = bounds?.getWest?.();
	const east = bounds?.getEast?.();
	const south = bounds?.getSouth?.();
	const north = bounds?.getNorth?.();
	if (
		west === undefined ||
		east === undefined ||
		south === undefined ||
		north === undefined ||
		east <= west ||
		north <= south
	) {
		return visibleCells;
	}
	const areas = new Map<string, SessionHeatmapArea>();
	for (const cell of visibleCells) {
		const column = Math.min(23, Math.floor(((cell.lng - west) / (east - west)) * 24));
		const row = Math.min(15, Math.floor(((cell.lat - south) / (north - south)) * 16));
		const key = `${column}:${row}`;
		const current = areas.get(key);
		if (!current) {
			areas.set(key, { ...cell });
			continue;
		}
		const sessionWeight = current.sessionWeight + cell.sessionWeight;
		areas.set(key, {
			lat: (current.lat * current.sessionWeight + cell.lat * cell.sessionWeight) / sessionWeight,
			lng: (current.lng * current.sessionWeight + cell.lng * cell.sessionWeight) / sessionWeight,
			sessionWeight,
		});
	}
	return [...areas.values()];
}

export function appSessionHeatmapScale(
	cells: AppSessionHeatmapCellView[],
	bounds?: SessionHeatmapBounds,
	aggregateAreas = true,
): SessionHeatmapScale {
	const visibleCells = bounds
		? cells.filter((cell) => bounds.contains([cell.lng, cell.lat]))
		: cells;
	const scaleCells = aggregateAreas ? appSessionHeatmapAreas(cells, bounds) : visibleCells;
	const sortedWeights = scaleCells
		.map((cell) => cell.sessionWeight)
		.filter((weight) => weight > 0)
		.sort((a, b) => a - b);
	if (sortedWeights.length === 0) return { low: 0, high: 0 };
	const lastIndex = sortedWeights.length - 1;
	return {
		low: sortedWeights[Math.floor(lastIndex * 0.1)] ?? 0,
		high: sortedWeights[Math.ceil(lastIndex * 0.9)] ?? 0,
	};
}

export const EMPTY_HEATMAP: AppSessionHeatmapFeatureCollection = {
	type: "FeatureCollection",
	features: [],
};

export function profileFilterValues(value: string | string[] | undefined): string[] {
	if (value === undefined) return [];
	if (Array.isArray(value)) return value;
	return [value];
}

function sessionAgeLabel(min: number | undefined, max: number | undefined) {
	if (min === undefined && max === undefined) return "";
	return {
		[`${true}`]: `${min}–${max}`,
		[`${min === undefined}`]: `≤ ${max}`,
		[`${max === undefined}`]: `${min}+`,
		[`${min === max}`]: String(min),
	}.true;
}

export function buildSessionFilterChips(
	filters: AppSessionFilters | undefined,
): SessionLegendFilterChip[] {
	if (!filters) return [];
	const chips: SessionLegendFilterChip[] = [];
	for (const value of profileFilterValues(filters.gender)) {
		chips.push({
			field: "gender",
			id: value.toLowerCase(),
			label: value.charAt(0).toUpperCase() + value.slice(1),
		});
	}
	for (const value of profileFilterValues(filters.skill)) {
		chips.push({
			field: "skill",
			id: value.toLowerCase(),
			label: value,
		});
	}
	const age = sessionAgeLabel(filters.ageMin, filters.ageMax);
	if (age) chips.push({ field: "age", id: "age", label: age });
	return chips;
}
