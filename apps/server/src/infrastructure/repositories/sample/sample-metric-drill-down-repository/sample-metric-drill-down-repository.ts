import {
	aggregateDrillDownFromFacts,
	DRILL_DOWN_MEASURE_KIND,
	DRILL_DOWN_RANGE_DAYS,
	type FacilityRepository,
	factsFromFacilityPoints,
	isAppActivityMeasure,
	type MetricDrillDownQuery,
	type MetricDrillDownRepository,
	type MetricDrillDownView,
	toFacilityPointView,
} from "@market-health-map/core/application";
import { type GameDepartmentCounts, statsWindow } from "@market-health-map/core/domain";

function share(games: number | null, ratio: number): number | null {
	return games === null ? null : Math.floor(games * ratio);
}

function shareByDepartment(
	counts: GameDepartmentCounts | null,
	ratio: number,
): GameDepartmentCounts | null {
	if (!counts) return null;
	return {
		magic: Math.floor(counts.magic * ratio),
		organizers: Math.floor(counts.organizers * ratio),
		partnerships: Math.floor(counts.partnerships * ratio),
	};
}

export class SampleMetricDrillDownRepository implements MetricDrillDownRepository {
	constructor(private readonly facilities: FacilityRepository) {}

	async group(query: MetricDrillDownQuery): Promise<MetricDrillDownView> {
		const days = DRILL_DOWN_RANGE_DAYS[query.range];
		const { start, end } = statsWindow(query.today, days);
		if (isAppActivityMeasure(query.measure))
			return {
				measure: query.measure,
				range: query.range,
				kind: DRILL_DOWN_MEASURE_KIND[query.measure],
				start,
				end,
				total: null,
				rows: [],
			};
		const points = (await this.facilities.listAll(query.today)).map(toFacilityPointView);
		const facts = factsFromFacilityPoints(points, query.range === "7d" ? "7d" : "28d").map(
			(facility) => ({
				...facility,
				scheduled: facility.games,
				scheduledByDepartment: facility.gamesByDepartment,
				rosteredCanceled: share(facility.games, 0.2),
				rosteredCanceledByDepartment: shareByDepartment(facility.gamesByDepartment, 0.2),
				almostFilled: share(facility.games, 0.08),
				almostFilledByDepartment: shareByDepartment(facility.gamesByDepartment, 0.08),
				missingRoster: 0,
				missingRosterByDepartment: shareByDepartment(facility.gamesByDepartment, 0),
				incidentGames: share(facility.games, 0.05),
				incidentGamesByDepartment: shareByDepartment(facility.gamesByDepartment, 0.05),
			}),
		);
		return aggregateDrillDownFromFacts({
			facilities: facts,
			measure: query.measure,
			slice: query.slice,
			marketId: query.marketId,
			facilityId: query.facilityId,
			department: query.department,
			gameDepartments: query.departments,
			start,
			end,
			range: query.range,
		});
	}
}
