import type {
	DrillDownFacilityFact,
	MetricDrillDownQuery,
	MetricDrillDownRepository,
	MetricDrillDownView,
} from "@market-health-map/core/application";
import {
	aggregateCountDrillDown,
	DRILL_DOWN_RANGE_DAYS,
} from "@market-health-map/core/application";
import { asEntityId, Facility, statsWindow } from "@market-health-map/core/domain";
import { companyLogoUrl } from "@server/infrastructure/repositories/warehouse/company-logo-url/company-logo-url";
import {
	gameDepartmentCase,
	ORGANIZER_PARTNERS_CTE,
	organizerPartnersJoin,
} from "@server/infrastructure/repositories/warehouse/game-department-sql/game-department-sql";
import { isIgnoredFacility } from "@server/infrastructure/repositories/warehouse/is-ignored-facility/is-ignored-facility";
import { isTestFacility } from "@server/infrastructure/repositories/warehouse/is-test-facility/is-test-facility";
import { mergeColocatedFacilities } from "@server/infrastructure/repositories/warehouse/merge-colocated-facilities/merge-colocated-facilities";
import { isWithinServiceArea } from "@server/infrastructure/repositories/warehouse/service-area/service-area";
import {
	inLastDaysSql,
	todayParameterSql,
} from "@server/infrastructure/repositories/warehouse/warehouse-day/warehouse-day";
import type {
	WarehouseDrillDownLocationRow,
	WarehouseQueryable,
} from "@server/infrastructure/repositories/warehouse/warehouse-metric-drill-down-repository/warehouse-metric-drill-down-repository.types";

const GAME_DATE = "g.date_with_time::date";
const UNASSIGNED_MARKET = "unassigned";

export function metricDrillDownLocationsSql(days: number): string {
	return `
with bounds as (
  select ${todayParameterSql(1)} as today
),
${ORGANIZER_PARTNERS_CTE},
classified_games as (
  select r.*, ${gameDepartmentCase("r")} as department
  from plei_gold.dim_reservation r
  ${organizerPartnersJoin("r")}
),
facility_activity as (
  select g.location_id,
         count(distinct g.reservation_id) as games,
         count(distinct g.reservation_id) filter (where g.department = 'magic') as magic_games,
         count(distinct g.reservation_id) filter (where g.department = 'organizers') as organizer_games,
         count(distinct g.reservation_id) filter (where g.department = 'partnerships') as partnership_games
  from classified_games g
  cross join bounds b
  where g.reservation_type = 'OpenReservation'
    and g.confirmed
    and g.status <> 'cancelled'
    and ${inLastDaysSql(GAME_DATE, "b.today", days)}
  group by g.location_id
)
select l.location_id, l.location_name, l.address, l.city, l.state,
       l.region_id, r.region_name, l.location_latitude, l.location_longitude,
       coalesce(a.games, 0) as games,
       coalesce(a.magic_games, 0) as magic_games,
       coalesce(a.organizer_games, 0) as organizer_games,
       coalesce(a.partnership_games, 0) as partnership_games,
       c.id as company_id, c.logo as company_logo
from plei_gold.dim_location l
left join plei_gold.dim_region r on r.region_id = l.region_id
left join facility_activity a on a.location_id = l.location_id
left join plei_bronze.companies c on c.id = l.company_id and c.deleted_at is null
where l.deleted_at is null
  and l.location_latitude is not null
  and l.location_longitude is not null
  and exists (
    select 1
    from plei_gold.dim_reservation posted
    where posted.location_id = l.location_id
  )
order by l.location_id`;
}

function formatAddress(row: WarehouseDrillDownLocationRow): string {
	const parts = [row.address, row.city, row.state].map((part) => part?.trim()).filter(Boolean);
	return parts.length > 0 ? parts.join(", ") : (row.region_name ?? "—");
}

export function toDrillDownFacility(row: WarehouseDrillDownLocationRow): Facility | null {
	if (
		!row.location_name?.trim() ||
		isTestFacility(row.location_name, row.region_name) ||
		isIgnoredFacility(row.location_name)
	) {
		return null;
	}
	const latitude = Number(row.location_latitude);
	const longitude = Number(row.location_longitude);
	if (!isWithinServiceArea(latitude, longitude)) return null;
	try {
		return Facility.create({
			id: asEntityId(String(row.location_id)),
			marketId: asEntityId(row.region_id === null ? UNASSIGNED_MARKET : String(row.region_id)),
			marketName: row.region_name ?? "Unassigned",
			name: row.location_name,
			address: formatAddress(row),
			location: { latitude, longitude },
			avatarUrl: companyLogoUrl(row.company_id, row.company_logo),
			metrics: {
				activePlayers: 0,
				gamesLastWeek: 0,
				gamesLast28Days: Number(row.games),
				gamesByDepartment: {
					magic: Number(row.magic_games),
					organizers: Number(row.organizer_games),
					partnerships: Number(row.partnership_games),
				},
				utilization: 0,
			},
		});
	} catch {
		return null;
	}
}

export function toDrillDownFacilityFact(facility: Facility): DrillDownFacilityFact {
	const props = facility.toJSON();
	return {
		id: props.id,
		name: props.name,
		marketId: props.marketId,
		marketName: facility.marketName,
		games: props.metrics.gamesLast28Days,
		gamesByDepartment: props.metrics.gamesByDepartment ?? null,
	};
}

export class WarehouseMetricDrillDownRepository implements MetricDrillDownRepository {
	constructor(private readonly warehouse: WarehouseQueryable) {}

	async group(query: MetricDrillDownQuery): Promise<MetricDrillDownView> {
		const days = DRILL_DOWN_RANGE_DAYS[query.range];
		const { start, end } = statsWindow(query.today, days);
		const { rows } = await this.warehouse.query<WarehouseDrillDownLocationRow>(
			metricDrillDownLocationsSql(days),
			[query.today],
		);
		const facilities = mergeColocatedFacilities(
			rows.flatMap((row) => {
				const facility = toDrillDownFacility(row);
				return facility ? [facility] : [];
			}),
		).map(toDrillDownFacilityFact);
		return aggregateCountDrillDown({
			facilities,
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
