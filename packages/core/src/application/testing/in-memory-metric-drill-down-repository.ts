import { DRILL_DOWN_RANGE_DAYS } from "@core/application/dtos/metric-drill-down-dto";
import type { MetricDrillDownView } from "@core/application/dtos/metric-drill-down-dto.types";
import type {
	MetricDrillDownQuery,
	MetricDrillDownRepository,
} from "@core/application/repositories/metric-drill-down-repository.types";
import {
	aggregateDrillDownFromFacts,
	type DrillDownFacilityFact,
} from "@core/application/services/aggregate-metric-drill-down";
import { statsWindow } from "@core/domain";

export class InMemoryMetricDrillDownRepository implements MetricDrillDownRepository {
	constructor(private readonly facilities: DrillDownFacilityFact[] = []) {}

	async group(query: MetricDrillDownQuery): Promise<MetricDrillDownView> {
		const { start, end } = statsWindow(query.today, DRILL_DOWN_RANGE_DAYS[query.range]);
		return aggregateDrillDownFromFacts({
			facilities: this.facilities,
			measure: query.measure,
			slice: query.slice,
			segment: query.segment,
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
