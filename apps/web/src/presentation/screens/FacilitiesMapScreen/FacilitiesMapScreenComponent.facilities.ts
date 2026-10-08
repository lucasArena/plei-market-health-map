import type { FacilityPointView, StatsPeriod } from "@market-health-map/core/application";
import type { GameDepartment, GameDepartmentCounts } from "@market-health-map/core/domain";
import { type GamesTrend, gamesTrend } from "@market-health-map/core/domain";
import type {
	ClusterGlassFeature,
	FacilityFeatureCollection,
} from "@/presentation/screens/FacilitiesMapScreen/FacilitiesMapScreenComponent.types";

export function facilitiesForPeriod(
	facilities: FacilityPointView[],
	period: StatsPeriod,
): FacilityPointView[] {
	if (period === "month") return facilities;
	return facilities.map((facility) => ({
		...facility,
		isActive: facility.isActiveLastWeek,
		gamesLast28Days: facility.gamesLastWeek,
		gamesByDepartment: facility.gamesLastWeekByDepartment,
		gamesPrevious28Days: facility.gamesPreviousWeek,
		gamesPreviousByDepartment: facility.gamesPreviousWeekByDepartment,
	}));
}

function byActiveLast(a: FacilityPointView, b: FacilityPointView): number {
	return Number(a.isActive) - Number(b.isActive);
}

export function toFacilityFeatureCollection(
	facilities: FacilityPointView[],
): FacilityFeatureCollection {
	return {
		type: "FeatureCollection",
		features: [...facilities].sort(byActiveLast).map((facility) => ({
			type: "Feature",
			geometry: {
				type: "Point",
				coordinates: [facility.location.longitude, facility.location.latitude],
			},
			properties: {
				id: facility.id,
				marketId: facility.marketId,
				marketName: facility.marketName,
				name: facility.name,
				isActive: facility.isActive,
				gamesLast28Days: facility.gamesLast28Days ?? 0,
				gamesPrevious28Days: facility.gamesPrevious28Days ?? 0,
			},
		})),
	};
}

function sumDepartments(
	counts: GameDepartmentCounts | undefined,
	departments: readonly GameDepartment[],
) {
	return departments.reduce((sum, department) => sum + (counts?.[department] ?? 0), 0);
}

export function facilitiesForMap(
	facilities: readonly FacilityPointView[],
	options: {
		gameDepartments?: readonly GameDepartment[];
		showGames: boolean;
		showTrend: boolean;
		showActiveFacilities: boolean;
		showInactiveFacilities: boolean;
	},
): FacilityPointView[] {
	const { gameDepartments, showGames, showTrend, showActiveFacilities, showInactiveFacilities } =
		options;
	return facilities
		.map((facility) => {
			if (!gameDepartments?.length) return facility;
			return {
				...facility,
				gamesLast28Days: sumDepartments(facility.gamesByDepartment, gameDepartments),
				gamesPrevious28Days: sumDepartments(facility.gamesPreviousByDepartment, gameDepartments),
			};
		})
		.filter((facility) => {
			const hasGames =
				(facility.gamesLast28Days ?? 0) > 0 ||
				(showTrend && (facility.gamesPrevious28Days ?? 0) > 0);
			if (gameDepartments?.length && !hasGames) return false;
			if (showGames) return showActiveFacilities && hasGames;
			return facility.isActive ? showActiveFacilities : showInactiveFacilities;
		});
}

export function trendNumber(value: unknown) {
	const count = Number(value ?? 0);
	return Number.isFinite(count) ? count : 0;
}

export function facilityTrend(current: unknown, previous: unknown): GamesTrend {
	return gamesTrend(trendNumber(current), trendNumber(previous));
}

export function clusterTrend(properties: ClusterGlassFeature["properties"]): GamesTrend {
	return gamesTrend(trendNumber(properties?.gameCount), trendNumber(properties?.gamePreviousCount));
}

export function facilitiesForIds(
	ids: unknown[],
	facilitiesById: Map<string, FacilityPointView>,
): FacilityPointView[] {
	return ids.flatMap((id) => {
		const facility = typeof id === "string" ? facilitiesById.get(id) : undefined;
		return facility ? [facility] : [];
	});
}

export function marketBounds(
	facilities: FacilityPointView[],
): [[number, number], [number, number]] | null {
	if (facilities.length === 0) return null;
	const longitudes = facilities.map((facility) => facility.location.longitude);
	const latitudes = facilities.map((facility) => facility.location.latitude);
	return [
		[Math.min(...longitudes), Math.min(...latitudes)],
		[Math.max(...longitudes), Math.max(...latitudes)],
	];
}
