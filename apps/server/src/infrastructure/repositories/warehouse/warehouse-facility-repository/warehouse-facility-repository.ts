import type { FacilityRepository } from "@market-health-map/core/application";
import { asEntityId, Facility, GAMES_WINDOW_DAYS } from "@market-health-map/core/domain";
import { companyLogoUrl } from "@server/infrastructure/repositories/warehouse/company-logo-url/company-logo-url";
import { isIgnoredFacility } from "@server/infrastructure/repositories/warehouse/is-ignored-facility/is-ignored-facility";
import { isTestFacility } from "@server/infrastructure/repositories/warehouse/is-test-facility/is-test-facility";
import { mergeColocatedFacilities } from "@server/infrastructure/repositories/warehouse/merge-colocated-facilities/merge-colocated-facilities";
import { isWithinServiceArea } from "@server/infrastructure/repositories/warehouse/service-area/service-area";
import { WAREHOUSE_TODAY_SQL } from "@server/infrastructure/repositories/warehouse/warehouse-day/warehouse-day";
import type {
	WarehouseLocationRow,
	WarehouseQueryable,
} from "@server/infrastructure/repositories/warehouse/warehouse-facility-repository/warehouse-facility-repository.types";

export const ACTIVE_LOCATIONS_SQL = `
with bounds as (
  select ${WAREHOUSE_TODAY_SQL} as today, date_trunc('week', ${WAREHOUSE_TODAY_SQL})::date as this_week
),
organizer_partners as (
  select distinct partner_id from plei_gold.fct_terms
  where name ilike '%Organizer Program%' and deleted_at is null
),
classified_games as (
  select r.*, case
    when r.partner_id in (6, 52, 62) then 'magic'
    when op.partner_id is not null then 'organizers'
    else 'partnerships' end as department
  from plei_gold.dim_reservation r
  left join organizer_partners op on op.partner_id = r.partner_id
),
facility_activity as (
  select r.location_id,
         count(distinct r.reservation_id) filter (where r.in_current) as played_last_28_days,
         count(distinct r.reservation_id) filter (where r.in_last_week) as played_last_week,
         count(distinct r.reservation_id) filter (where not r.in_current) as played_previous_28_days,
         count(distinct r.reservation_id) filter (where r.in_current and r.department = 'magic') as magic_games,
         count(distinct r.reservation_id) filter (where r.in_current and r.department = 'organizers') as organizer_games,
         count(distinct r.reservation_id) filter (where r.in_current and r.department = 'partnerships') as partnership_games,
         count(distinct r.reservation_id) filter (where not r.in_current and r.department = 'magic') as magic_games_previous,
         count(distinct r.reservation_id) filter (where not r.in_current and r.department = 'organizers') as organizer_games_previous,
         count(distinct r.reservation_id) filter (where not r.in_current and r.department = 'partnerships') as partnership_games_previous,
         count(distinct r.reservation_id) filter (where r.in_last_week and r.department = 'magic') as magic_games_last_week,
         count(distinct r.reservation_id) filter (where r.in_last_week and r.department = 'organizers') as organizer_games_last_week,
         count(distinct r.reservation_id) filter (where r.in_last_week and r.department = 'partnerships') as partnership_games_last_week,
         count(distinct r.reservation_id) filter (where r.in_previous_week) as played_previous_week,
         count(distinct r.reservation_id) filter (where r.in_previous_week and r.department = 'magic') as magic_games_previous_week,
         count(distinct r.reservation_id) filter (where r.in_previous_week and r.department = 'organizers') as organizer_games_previous_week,
         count(distinct r.reservation_id) filter (where r.in_previous_week and r.department = 'partnerships') as partnership_games_previous_week
  from (
    select g.location_id, g.reservation_id, g.department,
           g.date_with_time::date >= b.this_week - 7 and g.date_with_time::date < b.this_week as in_last_week,
           g.date_with_time::date >= b.this_week - 14 and g.date_with_time::date < b.this_week - 7 as in_previous_week,
           g.date_with_time::date >= b.today - ${GAMES_WINDOW_DAYS} as in_current
    from classified_games g
    cross join bounds b
    where g.reservation_type = 'OpenReservation'
      and g.confirmed
      and g.status <> 'cancelled'
      and g.date_with_time::date >= b.today - ${GAMES_WINDOW_DAYS * 2}
      and g.date_with_time::date < b.today
  ) r
  group by r.location_id
)
select l.location_id, l.location_name, l.address, l.city, l.state,
       l.region_id, r.region_name, l.location_latitude, l.location_longitude,
       coalesce(a.played_last_28_days, 0) as played_last_28_days,
       coalesce(a.magic_games, 0) as magic_games,
       coalesce(a.organizer_games, 0) as organizer_games,
       coalesce(a.partnership_games, 0) as partnership_games,
       coalesce(a.played_previous_28_days, 0) as played_previous_28_days,
       coalesce(a.magic_games_previous, 0) as magic_games_previous,
       coalesce(a.organizer_games_previous, 0) as organizer_games_previous,
       coalesce(a.partnership_games_previous, 0) as partnership_games_previous,
       coalesce(a.played_last_week, 0) as played_last_week,
       coalesce(a.magic_games_last_week, 0) as magic_games_last_week,
       coalesce(a.organizer_games_last_week, 0) as organizer_games_last_week,
       coalesce(a.partnership_games_last_week, 0) as partnership_games_last_week,
       coalesce(a.played_previous_week, 0) as played_previous_week,
       coalesce(a.magic_games_previous_week, 0) as magic_games_previous_week,
       coalesce(a.organizer_games_previous_week, 0) as organizer_games_previous_week,
       coalesce(a.partnership_games_previous_week, 0) as partnership_games_previous_week,
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

const UNASSIGNED_MARKET = "unassigned";

function formatAddress(row: WarehouseLocationRow): string {
	const parts = [row.address, row.city, row.state].map((part) => part?.trim()).filter(Boolean);
	return parts.length > 0 ? parts.join(", ") : (row.region_name ?? "—");
}

export function toFacility(row: WarehouseLocationRow): Facility | null {
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
				gamesLastWeek: Number(row.played_last_week),
				gamesLast28Days: Number(row.played_last_28_days),
				...(row.played_previous_28_days !== undefined
					? { gamesPrevious28Days: Number(row.played_previous_28_days) }
					: {}),
				...(row.magic_games !== undefined
					? {
							gamesByDepartment: {
								magic: Number(row.magic_games),
								organizers: Number(row.organizer_games),
								partnerships: Number(row.partnership_games),
							},
						}
					: {}),
				...(row.magic_games_previous !== undefined
					? {
							gamesPreviousByDepartment: {
								magic: Number(row.magic_games_previous),
								organizers: Number(row.organizer_games_previous),
								partnerships: Number(row.partnership_games_previous),
							},
						}
					: {}),
				...(row.magic_games_last_week !== undefined
					? {
							gamesLastWeekByDepartment: {
								magic: Number(row.magic_games_last_week),
								organizers: Number(row.organizer_games_last_week),
								partnerships: Number(row.partnership_games_last_week),
							},
						}
					: {}),
				...(row.played_previous_week !== undefined
					? { gamesPreviousWeek: Number(row.played_previous_week) }
					: {}),
				...(row.magic_games_previous_week !== undefined
					? {
							gamesPreviousWeekByDepartment: {
								magic: Number(row.magic_games_previous_week),
								organizers: Number(row.organizer_games_previous_week),
								partnerships: Number(row.partnership_games_previous_week),
							},
						}
					: {}),
				utilization: 0,
			},
		});
	} catch {
		return null;
	}
}

export class WarehouseFacilityRepository implements FacilityRepository {
	constructor(private readonly warehouse: WarehouseQueryable) {}

	async listAll(): Promise<Facility[]> {
		const { rows } = await this.warehouse.query<WarehouseLocationRow>(ACTIVE_LOCATIONS_SQL);
		return mergeColocatedFacilities(
			rows.flatMap((row) => {
				const facility = toFacility(row);
				return facility ? [facility] : [];
			}),
		);
	}
}
