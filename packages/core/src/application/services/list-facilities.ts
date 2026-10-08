import type { FacilityPointView } from "@core/application/dtos/facility-dto.types";
import type { FeatureFlagKey } from "@core/application/dtos/feature-flags-dto.types";
import { toFacilityPointView } from "@core/application/mappers/facility-mapper";
import type { ListFacilitiesDeps } from "@core/application/services/list-facilities.types";
import { statsToday } from "@core/application/services/stats-today";

const GAMES_FLAG: FeatureFlagKey = "facility-games-layer";
const GAMES_TREND_FLAG: FeatureFlagKey = "facility-games-trend";

function gateFacilityPoint(
	point: FacilityPointView,
	showGames: boolean,
	showTrend: boolean,
): FacilityPointView {
	if (showGames && showTrend) return point;
	const {
		gamesLast28Days,
		gamesByDepartment,
		gamesPrevious28Days: _previous,
		gamesPreviousByDepartment: _previousByDepartment,
		gamesLastWeek,
		gamesLastWeekByDepartment,
		gamesPreviousWeek: _previousWeek,
		gamesPreviousWeekByDepartment: _previousWeekByDepartment,
		...rest
	} = point;
	if (!showGames) return rest;
	return {
		...rest,
		gamesLast28Days,
		...(gamesByDepartment ? { gamesByDepartment } : {}),
		gamesLastWeek,
		...(gamesLastWeekByDepartment ? { gamesLastWeekByDepartment } : {}),
	};
}

export function makeListFacilities({ facilities, enabledFeatureFlags, clock }: ListFacilitiesDeps) {
	return async function listFacilities(
		input: { timeZone?: string } = {},
	): Promise<FacilityPointView[]> {
		const today = statsToday(clock, input.timeZone);
		const [all, flags] = await Promise.all([facilities.listAll(today), enabledFeatureFlags()]);
		const showGames = flags.enabled.includes(GAMES_FLAG);
		const showTrend = showGames && flags.enabled.includes(GAMES_TREND_FLAG);
		return all.map((facility) =>
			gateFacilityPoint(toFacilityPointView(facility), showGames, showTrend),
		);
	};
}
