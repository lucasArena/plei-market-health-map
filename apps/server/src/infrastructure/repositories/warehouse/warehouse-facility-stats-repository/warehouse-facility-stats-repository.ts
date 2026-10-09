import type {
	FacilityGameComparison,
	FacilityPlayerStats,
	FacilityPlayerStatsFilters,
	FacilityReservationStats,
	FacilityReservationStatsFilters,
	FacilityStatsRepository,
} from "@market-health-map/core/application";
import { type EntityId, normalizeGameDepartments } from "@market-health-map/core/domain";
import {
	gameDepartmentCase,
	ORGANIZER_PARTNERS_CTE,
	organizerPartnersJoin,
} from "@server/infrastructure/repositories/warehouse/game-department-sql/game-department-sql";
import {
	CONFIRMED_PLEIAPP_PLAYER_SQL,
	isOperationalCancellationSql,
	isPlayedGameSql,
	OPENED_GAME_PLAYER_TYPE_SQL,
	QUALIFYING_OPENED_GAME_SQL,
} from "@server/infrastructure/repositories/warehouse/reservation-game-sql/reservation-game-sql";
import {
	inLastDaysSql,
	inPreviousDaysSql,
	MONTH_DAYS,
	todayParameterSql,
	WEEK_DAYS,
} from "@server/infrastructure/repositories/warehouse/warehouse-day/warehouse-day";
import type {
	WarehouseFacilityGameComparisonRow,
	WarehouseFacilityPlayerStatsRow,
	WarehouseFacilityReservationStatsRow,
	WarehouseParameterizedQueryable,
} from "@server/infrastructure/repositories/warehouse/warehouse-facility-stats-repository/warehouse-facility-stats-repository.types";

const GAME_DATE = "r.date_with_time::date";

export const FACILITY_GAME_COMPARISONS_SQL = `
with bounds as (
  select ${todayParameterSql(2)} as today
)
select r.location_id,
 count(distinct r.reservation_id) filter (
   where ${inLastDaysSql(GAME_DATE, "b.today", WEEK_DAYS)}
 ) as played_last_week,
 count(distinct r.reservation_id) filter (
   where ${inPreviousDaysSql(GAME_DATE, "b.today", WEEK_DAYS)}
 ) as played_previous_week,
 count(distinct r.reservation_id) filter (
   where ${inLastDaysSql(GAME_DATE, "b.today", MONTH_DAYS)}
 ) as played_last_28_days,
 count(distinct r.reservation_id) filter (
   where ${inPreviousDaysSql(GAME_DATE, "b.today", MONTH_DAYS)}
 ) as played_previous_28_days
from plei_gold.dim_reservation r
cross join bounds b
where r.location_id = any($1::int[])
 and r.reservation_type = 'OpenReservation'
 and r.confirmed and r.status <> 'cancelled'
 and r.date_with_time::date >= b.today - ${MONTH_DAYS * 2}
 and r.date_with_time::date < b.today
group by r.location_id`;

function reservationStatsSql(byDepartment: boolean): string {
	const organizerPartners = byDepartment ? `${ORGANIZER_PARTNERS_CTE},\n` : "";
	const join = (indent: string) => (byDepartment ? `\n${indent}${organizerPartnersJoin("r")}` : "");
	const filter = (indent: string) =>
		byDepartment ? `\n${indent}and ${gameDepartmentCase("r")} = any($3::text[])` : "";
	return `
with bounds as (
  select ${todayParameterSql(2)} as today
),
${organizerPartners}games as (
  select r.reservation_id, r.date_with_time as game_time, r.date_with_time::date as game_date,
    r.status, r.confirmed
  from plei_gold.dim_reservation r${join("  ")}
  where r.location_id = any($1::int[])
    and r.reservation_type = 'OpenReservation'
    and r.date_with_time::date >= (select today - 56 from bounds)
    and r.date_with_time::date <= (select today + 7 from bounds)
    and not (
      ${isOperationalCancellationSql("r")}
    )${filter("    ")}
),
last_played as (
  select coalesce(
    (
      select max(g.game_date)
      from games g
      where ${isPlayedGameSql("g")} and g.game_date < (select today from bounds)
    ),
    (
      select max(r.date_with_time::date)
      from plei_gold.dim_reservation r${join("      ")}
      where r.location_id = any($1::int[])
        and r.reservation_type = 'OpenReservation'
        and r.confirmed
        and r.status <> 'cancelled'
        and r.date_with_time::date < (select today from bounds)${filter("        ")}
    )
  )::text as game_date
),
week_series as (
  select generate_series(b.today - ${MONTH_DAYS * 2}, b.today - ${WEEK_DAYS}, interval '7 days')::date as week_start
  from bounds b
),
weekly_activity as (
  select w.week_start,
    count(distinct g.reservation_id) filter (
      where ${isPlayedGameSql("g")}
        and g.game_date >= w.week_start and g.game_date < w.week_start + 7
    ) as games_played
  from week_series w
  left join games g on g.game_date >= w.week_start and g.game_date < w.week_start + 7
  group by w.week_start
),
time_grid as (
  select day_of_week, time_period
  from generate_series(1, 7) day_of_week
  cross join generate_series(0, 3) time_period
),
popular_times as (
  select t.day_of_week, t.time_period,
    count(distinct g.reservation_id) filter (
      where ${isPlayedGameSql("g")}
    ) as games_played
  from time_grid t
  left join games g
    on extract(isodow from g.game_time - interval '7 hours')::int = t.day_of_week
    and case
      when extract(hour from g.game_time) between 7 and 11 then 0
      when extract(hour from g.game_time) between 12 and 16 then 1
      when extract(hour from g.game_time) between 17 and 21 then 2
      else 3
    end = t.time_period
    and g.game_date >= (select today - 28 from bounds)
    and g.game_date < (select today from bounds)
  group by t.day_of_week, t.time_period
)
select
  (b.today - 28)::text as period_start,
  (b.today - 1)::text as period_end,
  (b.today - ${WEEK_DAYS})::text as week_start,
  count(distinct g.reservation_id) filter (
    where ${isPlayedGameSql("g")}
      and ${inLastDaysSql("g.game_date", "b.today", WEEK_DAYS)}
  ) as played_last_week,
  count(distinct g.reservation_id) filter (
    where ${isPlayedGameSql("g")}
      and ${inPreviousDaysSql("g.game_date", "b.today", WEEK_DAYS)}
  ) as played_previous_week,
  count(distinct g.reservation_id) filter (
    where ${isPlayedGameSql("g")}
      and g.game_date >= b.today - 28 and g.game_date < b.today
  ) as played_last_28_days,
  count(distinct g.reservation_id) filter (
    where g.game_date >= b.today - 28 and g.game_date < b.today
  ) as scheduled_last_28_days,
  count(distinct g.reservation_id) filter (
    where ${isPlayedGameSql("g")}
      and g.game_date >= b.today - 56 and g.game_date < b.today - 28
  ) as played_previous_28_days,
  count(distinct g.reservation_id) filter (
    where g.game_date >= b.today - 56 and g.game_date < b.today - 28
  ) as scheduled_previous_28_days,
  count(distinct g.reservation_id) filter (
    where ${inLastDaysSql("g.game_date", "b.today", WEEK_DAYS)}
  ) as scheduled_last_week,
  count(distinct g.reservation_id) filter (
    where ${inPreviousDaysSql("g.game_date", "b.today", WEEK_DAYS)}
  ) as scheduled_previous_week,
  count(distinct g.reservation_id) filter (
    where g.status = 'cancelled'
      and ${inLastDaysSql("g.game_date", "b.today", WEEK_DAYS)}
  ) as cancelled_last_week,
  count(distinct g.reservation_id) filter (
    where g.status = 'cancelled'
      and ${inPreviousDaysSql("g.game_date", "b.today", WEEK_DAYS)}
  ) as cancelled_previous_week,
  count(distinct g.reservation_id) filter (
    where g.status = 'cancelled'
      and g.game_date >= b.today - 28 and g.game_date < b.today
  ) as cancelled_last_28_days,
  count(distinct g.reservation_id) filter (
    where g.status = 'cancelled'
      and g.game_date >= b.today - 56 and g.game_date < b.today - 28
  ) as cancelled_previous_28_days,
  count(distinct g.reservation_id) filter (
    where g.status <> 'cancelled' and g.game_date > b.today and g.game_date <= b.today + 7
  ) as upcoming_next_seven_days,
  (select game_date from last_played) as last_played_date,
  (select json_agg(json_build_object(
    'week_start', w.week_start::text,
    'games_played', w.games_played
  ) order by w.week_start) from weekly_activity w) as weekly_activity,
  (select json_agg(json_build_object(
    'day_of_week', p.day_of_week,
    'time_period', p.time_period,
    'games_played', p.games_played
  ) order by p.time_period, p.day_of_week) from popular_times p) as popular_times
from bounds b
left join games g on true
group by b.today`;
}

export const FACILITY_RESERVATION_STATS_SQL = reservationStatsSql(false);

export const FACILITY_RESERVATION_STATS_BY_DEPARTMENT_SQL = reservationStatsSql(true);

function playerStatsSql(byDepartment: boolean): string {
	const departmentGames = byDepartment
		? `${ORGANIZER_PARTNERS_CTE},
department_games as (
  select r.reservation_id
  from plei_gold.dim_reservation r
  ${organizerPartnersJoin("r")}
  where r.location_id = any($1::int[])
    and r.date_with_time::date >= ${todayParameterSql(2)} - ${MONTH_DAYS * 2}
    and r.date_with_time::date < ${todayParameterSql(2)}
    and ${gameDepartmentCase("r")} = any($3::text[])
),
`
		: "";
	const departmentFilter = byDepartment
		? `
    and f.reservation_id in (select reservation_id from department_games)`
		: "";
	return `
with bounds as (
  select ${todayParameterSql(2)} as today
),
${departmentGames}facility_players as (
  select f.player_id, f.player_lifecycle, f.date_played
  from plei_gold.fct_games_opened f
  where f.location_id = any($1::int[])
    and f.date_played >= ${todayParameterSql(2)} - ${MONTH_DAYS * 2}
    and f.date_played < ${todayParameterSql(2)}
    and ${QUALIFYING_OPENED_GAME_SQL}
    and ${OPENED_GAME_PLAYER_TYPE_SQL}${departmentFilter}
    and ${CONFIRMED_PLEIAPP_PLAYER_SQL}
),
week_series as (
  select generate_series(b.today - ${MONTH_DAYS * 2}, b.today - ${WEEK_DAYS}, interval '7 days')::date as week_start
  from bounds b
),
weekly_activated_players as (
  select w.week_start,
    count(distinct f.player_id) filter (
      where f.player_lifecycle = 'Activated'
    ) as players
  from week_series w
  left join facility_players f on f.date_played >= w.week_start and f.date_played < w.week_start + 7
  group by w.week_start
)
select
  count(distinct player_id) filter (
    where ${inLastDaysSql("date_played", "b.today", WEEK_DAYS)}
  ) as unique_players_last_week,
  count(distinct player_id) filter (
    where ${inPreviousDaysSql("date_played", "b.today", WEEK_DAYS)}
  ) as unique_players_previous_week,
  count(distinct player_id) filter (
    where player_lifecycle = 'Activated'
      and ${inLastDaysSql("date_played", "b.today", WEEK_DAYS)}
  ) as activated_players_last_week,
  count(distinct player_id) filter (
    where player_lifecycle = 'Activated'
      and ${inPreviousDaysSql("date_played", "b.today", WEEK_DAYS)}
  ) as activated_players_previous_week,
  count(distinct player_id) filter (
    where date_played >= b.today - 28
  ) as unique_players_last_28_days,
  count(distinct player_id) filter (
    where date_played < b.today - 28
  ) as unique_players_previous_28_days,
  count(distinct player_id) filter (
    where player_lifecycle = 'Activated' and date_played >= b.today - 28
  ) as activated_players_last_28_days,
  count(distinct player_id) filter (
    where player_lifecycle = 'Activated' and date_played < b.today - 28
  ) as activated_players_previous_28_days,
  (select json_agg(json_build_object(
    'week_start', w.week_start::text,
    'players', w.players
  ) order by w.week_start) from weekly_activated_players w) as weekly_activated_players
from bounds b
left join facility_players f on true
group by b.today`;
}

export const FACILITY_PLAYER_STATS_SQL = playerStatsSql(false);

export const FACILITY_PLAYER_STATS_BY_DEPARTMENT_SQL = playerStatsSql(true);

export function toReservationStats(
	row: WarehouseFacilityReservationStatsRow,
): FacilityReservationStats {
	return {
		periodStart: row.period_start,
		periodEnd: row.period_end,
		weekStart: row.week_start,
		playedLastWeek: Number(row.played_last_week),
		playedPreviousWeek: Number(row.played_previous_week),
		playedLast28Days: Number(row.played_last_28_days),
		playedPrevious28Days: Number(row.played_previous_28_days),
		scheduledLast28Days: Number(row.scheduled_last_28_days),
		scheduledPrevious28Days: Number(row.scheduled_previous_28_days),
		scheduledLastWeek: Number(row.scheduled_last_week),
		scheduledPreviousWeek: Number(row.scheduled_previous_week),
		cancelledLastWeek: Number(row.cancelled_last_week),
		cancelledPreviousWeek: Number(row.cancelled_previous_week),
		cancelledLast28Days: Number(row.cancelled_last_28_days),
		cancelledPrevious28Days: Number(row.cancelled_previous_28_days),
		upcomingNextSevenDays: Number(row.upcoming_next_seven_days),
		lastPlayedDate: row.last_played_date,
		weeklyActivity: row.weekly_activity.map((item) => ({
			weekStart: item.week_start,
			gamesPlayed: Number(item.games_played),
		})),
		popularTimes: row.popular_times.map((item) => ({
			dayOfWeek: Number(item.day_of_week),
			timePeriod: Number(item.time_period),
			gamesPlayed: Number(item.games_played),
		})),
	};
}

export function toPlayerStats(row: WarehouseFacilityPlayerStatsRow): FacilityPlayerStats {
	return {
		uniquePlayersLastWeek: Number(row.unique_players_last_week),
		uniquePlayersPreviousWeek: Number(row.unique_players_previous_week),
		uniquePlayersLast28Days: Number(row.unique_players_last_28_days),
		uniquePlayersPrevious28Days: Number(row.unique_players_previous_28_days),
		activatedPlayersLastWeek: Number(row.activated_players_last_week),
		activatedPlayersPreviousWeek: Number(row.activated_players_previous_week),
		activatedPlayersLast28Days: Number(row.activated_players_last_28_days),
		activatedPlayersPrevious28Days: Number(row.activated_players_previous_28_days),
		weeklyActivatedPlayers: row.weekly_activated_players.map((item) => ({
			weekStart: item.week_start,
			players: Number(item.players),
		})),
	};
}

export class WarehouseFacilityStatsRepository implements FacilityStatsRepository {
	constructor(private readonly warehouse: WarehouseParameterizedQueryable) {}

	async getReservationStats(
		facilityIds: EntityId[],
		today: string,
		filters?: FacilityReservationStatsFilters,
	): Promise<FacilityReservationStats> {
		const departments = normalizeGameDepartments(filters?.departments);
		const ids = facilityIds.map(Number);
		const { rows } = await (departments.length > 0
			? this.warehouse.query<WarehouseFacilityReservationStatsRow>(
					FACILITY_RESERVATION_STATS_BY_DEPARTMENT_SQL,
					[ids, today, departments],
				)
			: this.warehouse.query<WarehouseFacilityReservationStatsRow>(FACILITY_RESERVATION_STATS_SQL, [
					ids,
					today,
				]));
		const [row] = rows;
		if (!row) {
			throw new Error(`No reservation stats row returned for facility ${facilityIds.join(", ")}.`);
		}
		return toReservationStats(row);
	}

	async getGameComparisons(
		facilityIds: EntityId[],
		today: string,
	): Promise<FacilityGameComparison[]> {
		const { rows } = await this.warehouse.query<WarehouseFacilityGameComparisonRow>(
			FACILITY_GAME_COMPARISONS_SQL,
			[facilityIds.map(Number), today],
		);
		return rows.map((row) => ({
			facilityId: String(row.location_id) as EntityId,
			playedLastWeek: Number(row.played_last_week),
			playedPreviousWeek: Number(row.played_previous_week),
			playedLast28Days: Number(row.played_last_28_days),
			playedPrevious28Days: Number(row.played_previous_28_days),
		}));
	}

	async getPlayerStats(
		facilityIds: EntityId[],
		today: string,
		filters?: FacilityPlayerStatsFilters,
	): Promise<FacilityPlayerStats> {
		const departments = normalizeGameDepartments(filters?.departments);
		const ids = facilityIds.map(Number);
		const { rows } = await (departments.length > 0
			? this.warehouse.query<WarehouseFacilityPlayerStatsRow>(
					FACILITY_PLAYER_STATS_BY_DEPARTMENT_SQL,
					[ids, today, departments],
				)
			: this.warehouse.query<WarehouseFacilityPlayerStatsRow>(FACILITY_PLAYER_STATS_SQL, [
					ids,
					today,
				]));
		const [row] = rows;
		if (!row) {
			throw new Error(`No player stats row returned for facility ${facilityIds.join(", ")}.`);
		}
		return toPlayerStats(row);
	}
}
