import {
	aggregateCountDrillDown,
	DRILL_DOWN_RANGE_DAYS,
	type FacilityRepository,
	factsFromFacilityPoints,
	type MetricDrillDownQuery,
	type MetricDrillDownRepository,
	type MetricDrillDownView,
	toFacilityPointView,
} from "@market-health-map/core/application";
import { statsWindow } from "@market-health-map/core/domain";

export class SampleMetricDrillDownRepository implements MetricDrillDownRepository {
	constructor(private readonly facilities: FacilityRepository) {}

	async group(query: MetricDrillDownQuery): Promise<MetricDrillDownView> {
		const days = DRILL_DOWN_RANGE_DAYS[query.range];
		const { start, end } = statsWindow(query.today, days);
		const points = (await this.facilities.listAll(query.today)).map(toFacilityPointView);
		const facts = factsFromFacilityPoints(points, query.range === "7d" ? "7d" : "28d");
		return aggregateCountDrillDown({
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
