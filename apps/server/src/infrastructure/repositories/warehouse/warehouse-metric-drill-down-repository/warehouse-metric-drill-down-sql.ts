import { GAME_DEPARTMENTS } from "@market-health-map/core/domain";
import {
	gameDepartmentCase,
	ORGANIZER_PARTNERS_CTE,
	organizerPartnersJoin,
} from "@server/infrastructure/repositories/warehouse/game-department-sql/game-department-sql";
import {
	CONFIRMED_PLEIAPP_PLAYER_SQL,
	isEligibleCancellationSql,
	isOperationalCancellationSql,
	isPlayedGameSql,
	OPENED_GAME_PLAYER_TYPE_SQL,
	QUALIFYING_OPENED_GAME_SQL,
} from "@server/infrastructure/repositories/warehouse/reservation-game-sql/reservation-game-sql";
import {
	inLastDaysSql,
	todayParameterSql,
} from "@server/infrastructure/repositories/warehouse/warehouse-day/warehouse-day";
import type { WarehouseQualityCount } from "@server/infrastructure/repositories/warehouse/warehouse-metric-drill-down-repository/warehouse-metric-drill-down-repository.types";

const GAME_DATE = "r.date_with_time::date";

export function metricDrillDownFacilitiesSql(): string {
	return `
select l.location_id, l.location_name, l.address, l.city, l.state,
       l.region_id, r.region_name, l.location_latitude, l.location_longitude,
       0 as games, 0 as magic_games, 0 as organizer_games, 0 as partnership_games,
       c.id as company_id, c.logo as company_logo
from plei_gold.dim_location l
left join plei_gold.dim_region r on r.region_id = l.region_id
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

export function metricDrillDownReservationSql(days: number, byDepartment: boolean): string {
	const departmentFilter = byDepartment
		? `
    and ${gameDepartmentCase("r")} = any($3::text[])`
		: "";
	return `
with bounds as (
  select ${todayParameterSql(2)} as today
),
${ORGANIZER_PARTNERS_CTE},
games as (
  select r.reservation_id, r.location_id, r.date_with_time::date as game_date,
    r.status, r.confirmed, ${gameDepartmentCase("r")} as department
  from plei_gold.dim_reservation r
  ${organizerPartnersJoin("r")}
  cross join bounds b
  where r.location_id = any($1::int[])
    and r.reservation_type = 'OpenReservation'
    and ${inLastDaysSql(GAME_DATE, "b.today", days)}
    and not (
      ${isOperationalCancellationSql("r")}
    )${departmentFilter}
)
select g.location_id,
  count(distinct g.reservation_id) as scheduled,
  count(distinct g.reservation_id) filter (where ${isPlayedGameSql("g")}) as played,
  count(distinct g.reservation_id) filter (where g.department = 'magic') as scheduled_magic,
  count(distinct g.reservation_id) filter (where g.department = 'organizers') as scheduled_organizers,
  count(distinct g.reservation_id) filter (where g.department = 'partnerships') as scheduled_partnerships,
  count(distinct g.reservation_id) filter (
    where ${isPlayedGameSql("g")} and g.department = 'magic'
  ) as played_magic,
  count(distinct g.reservation_id) filter (
    where ${isPlayedGameSql("g")} and g.department = 'organizers'
  ) as played_organizers,
  count(distinct g.reservation_id) filter (
    where ${isPlayedGameSql("g")} and g.department = 'partnerships'
  ) as played_partnerships
from games g
group by g.location_id`;
}

export const QUALITY_COUNTS = [
	"almost_filled",
	"rostered_canceled",
	"missing_roster",
	"happened",
	"incident_games",
] as const satisfies readonly WarehouseQualityCount[];

function qualityCountColumns(): string {
	return QUALITY_COUNTS.flatMap((name) => [
		`count(distinct c.reservation_id) filter (where c.${name}) as ${name}`,
		...GAME_DEPARTMENTS.map(
			(department) =>
				`count(distinct c.reservation_id) filter (where c.${name} and c.department = '${department}') as ${name}_${department}`,
		),
	]).join(",\n  ");
}

export function metricDrillDownQualitySql(days: number, byDepartment: boolean): string {
	const departmentFilter = byDepartment
		? `
    and ${gameDepartmentCase("r")} = any($3::text[])`
		: "";
	const hasRoster = "coalesce(ro.payout_rows = 1 and ro.real_player_count is not null, false)";
	return `
with bounds as (
  select ${todayParameterSql(2)} as today
),
${ORGANIZER_PARTNERS_CTE},
games as (
  select r.reservation_id, r.location_id, r.status, r.confirmed, r.cancellation_reason,
    r.min_player_count, ${gameDepartmentCase("r")} as department
  from plei_gold.dim_reservation r
  ${organizerPartnersJoin("r")}
  cross join bounds b
  where r.location_id = any($1::int[])
    and r.reservation_type = 'OpenReservation'
    and ${inLastDaysSql(GAME_DATE, "b.today", days)}${departmentFilter}
),
rosters as (
  select p.reservation_id, count(*) as payout_rows, max(p.real_player_count) as real_player_count
  from plei_gold.fct_payouts p
  where p.reservation_id in (
    select g.reservation_id from games g where ${isEligibleCancellationSql("g")}
  )
  group by p.reservation_id
),
low_rating_games as (
  select distinct v.reservation_id
  from plei_gold.dim_review v
  where v.rate < 3
    and v.reservation_id in (select g.reservation_id from games g where ${isPlayedGameSql("g")})
),
classified as (
  select g.reservation_id, g.location_id, g.department,
    ${isPlayedGameSql("g")} as happened,
    ${isPlayedGameSql("g")} and lrg.reservation_id is not null as incident_games,
    ${isEligibleCancellationSql("g")} and ${hasRoster} as rostered_canceled,
    ${isEligibleCancellationSql("g")} and not ${hasRoster} as missing_roster,
    ${isEligibleCancellationSql("g")} and ${hasRoster}
      and g.min_player_count - ro.real_player_count between 1 and 3 as almost_filled
  from games g
  left join rosters ro on ro.reservation_id = g.reservation_id
  left join low_rating_games lrg on lrg.reservation_id = g.reservation_id
)
select c.location_id,
  ${qualityCountColumns()}
from classified c
group by c.location_id`;
}

export function metricDrillDownPlayerSql(
	days: number,
	activated: boolean,
	byDepartment: boolean,
): string {
	const departmentFilter = byDepartment
		? `
    and ${gameDepartmentCase("r")} = any($3::text[])`
		: "";
	const reservationJoin = byDepartment ? "" : "left ";
	return `
with bounds as (
  select ${todayParameterSql(2)} as today
),
${ORGANIZER_PARTNERS_CTE}
select distinct f.location_id, f.player_id, ${gameDepartmentCase("r")} as department
from plei_gold.fct_games_opened f
cross join bounds b
${reservationJoin}join plei_gold.dim_reservation r on r.reservation_id = f.reservation_id
${organizerPartnersJoin("r")}
where f.location_id = any($1::int[])
  and ${inLastDaysSql("f.date_played", "b.today", days)}
  and ${QUALIFYING_OPENED_GAME_SQL}
  and ${OPENED_GAME_PLAYER_TYPE_SQL}
  and ${CONFIRMED_PLEIAPP_PLAYER_SQL}
  ${activated ? "and f.player_lifecycle = 'Activated'" : ""}${departmentFilter}`;
}
