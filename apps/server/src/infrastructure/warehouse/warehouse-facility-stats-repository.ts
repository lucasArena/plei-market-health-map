import type {
	FacilityStatsRepository,
	FacilityWeeklyCounts,
} from "@market-health-map/core/application";
import type { EntityId } from "@market-health-map/core/domain";
import type {
	WarehouseFacilityStatsRow,
	WarehouseParameterizedQueryable,
} from "@server/infrastructure/warehouse/warehouse-facility-stats.types";

export const FACILITY_WEEKLY_STATS_SQL = `
with bounds as (
  select date_trunc('week', current_date)::date as this_week, current_date as today
),
games as (
  select r.reservation_id, r.date_with_time as game_time, r.date_with_time::date as game_date,
    r.status, r.confirmed
  from plei_gold.dim_reservation r
  where r.location_id = any($1::int[])
    and r.reservation_type = 'OpenReservation'
    and not (
      r.status = 'cancelled'
      and r.cancellation_reason in ('Recurring game series', 'Operational changes')
    )
),
eligible_players as (
  select distinct p.player_id
  from plei_gold.dim_player p
  where p.confirmed_at is not null and p.players_type = 'pleiapp_player'
),
facility_players as (
  select f.player_id, f.player_lifecycle, f.date_played
  from plei_gold.fct_games_opened f
  join eligible_players p on p.player_id = f.player_id
  cross join bounds b
  where f.location_id = any($1::int[])
    and f.date_played >= b.this_week - 56 and f.date_played < b.this_week
    and f.valid_player = 1 and f.confirmed_game = 1 and f.open_reservation_games = 1
    and f.dropping_date_local is null and f.players_type = 'pleiapp_player'
),
week_series as (
  select generate_series(b.this_week - 28, b.this_week - 7, interval '7 days')::date as week_start
  from bounds b
),
weekly_activity as (
  select w.week_start,
    count(distinct g.reservation_id) filter (
      where g.confirmed and g.status <> 'cancelled'
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
      where g.confirmed and g.status <> 'cancelled'
    ) as games_played
  from time_grid t
  left join games g
    on extract(isodow from g.game_time)::int = t.day_of_week
    and case
      when extract(hour from g.game_time) < 12 then 0
      when extract(hour from g.game_time) < 17 then 1
      when extract(hour from g.game_time) < 21 then 2
      else 3
    end = t.time_period
    and g.game_date >= (select this_week - 28 from bounds)
    and g.game_date < (select this_week from bounds)
  group by t.day_of_week, t.time_period
)
select
  (b.this_week - 7)::text as week_start,
  count(distinct g.reservation_id) filter (
    where g.confirmed and g.status <> 'cancelled'
      and g.game_date >= b.this_week - 7 and g.game_date < b.this_week
  ) as played_last_week,
  count(distinct g.reservation_id) filter (
    where g.confirmed and g.status <> 'cancelled'
      and g.game_date >= b.this_week - 14 and g.game_date < b.this_week - 7
  ) as played_previous_week,
  count(distinct g.reservation_id) filter (
    where g.confirmed and g.status <> 'cancelled'
      and g.game_date >= b.this_week - 28 and g.game_date < b.this_week
  ) as played_last_28_days,
  count(distinct g.reservation_id) filter (
    where g.game_date >= b.this_week - 28 and g.game_date < b.this_week
  ) as scheduled_last_28_days,
  count(distinct g.reservation_id) filter (
    where g.confirmed and g.status <> 'cancelled'
      and g.game_date >= b.this_week - 56 and g.game_date < b.this_week - 28
  ) as played_previous_28_days,
  count(distinct g.reservation_id) filter (
    where g.game_date >= b.this_week - 56 and g.game_date < b.this_week - 28
  ) as scheduled_previous_28_days,
  (select count(distinct player_id) from facility_players
    where date_played >= (select this_week - 28 from bounds)
      and date_played < (select this_week from bounds)
  ) as unique_players_last_28_days,
  (select count(distinct player_id) from facility_players
    where date_played >= (select this_week - 56 from bounds)
      and date_played < (select this_week - 28 from bounds)
  ) as unique_players_previous_28_days,
  (select count(distinct player_id) from facility_players
    where player_lifecycle = 'Activated'
      and date_played >= (select this_week - 28 from bounds)
      and date_played < (select this_week from bounds)
  ) as activated_players_last_28_days,
  (select count(distinct player_id) from facility_players
    where player_lifecycle = 'Activated'
      and date_played >= (select this_week - 56 from bounds)
      and date_played < (select this_week - 28 from bounds)
  ) as activated_players_previous_28_days,
  count(distinct g.reservation_id) filter (
    where g.game_date >= b.this_week - 7 and g.game_date < b.this_week
  ) as scheduled_last_week,
  count(distinct g.reservation_id) filter (
    where g.status = 'cancelled'
      and g.game_date >= b.this_week - 7 and g.game_date < b.this_week
  ) as cancelled_last_week,
  count(distinct g.reservation_id) filter (
    where g.status <> 'cancelled' and g.game_date > b.today and g.game_date <= b.today + 7
  ) as upcoming_next_seven_days,
  (max(g.game_date) filter (
    where g.confirmed and g.status <> 'cancelled' and g.game_date < b.today
  ))::text as last_played_date,
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
group by b.this_week, b.today`;

export function toWeeklyCounts(row: WarehouseFacilityStatsRow): FacilityWeeklyCounts {
	return {
		weekStart: row.week_start,
		playedLastWeek: Number(row.played_last_week),
		playedPreviousWeek: Number(row.played_previous_week),
		playedLast28Days: Number(row.played_last_28_days),
		playedPrevious28Days: Number(row.played_previous_28_days),
		scheduledLast28Days: Number(row.scheduled_last_28_days),
		scheduledPrevious28Days: Number(row.scheduled_previous_28_days),
		uniquePlayersLast28Days: Number(row.unique_players_last_28_days),
		uniquePlayersPrevious28Days: Number(row.unique_players_previous_28_days),
		activatedPlayersLast28Days: Number(row.activated_players_last_28_days),
		activatedPlayersPrevious28Days: Number(row.activated_players_previous_28_days),
		scheduledLastWeek: Number(row.scheduled_last_week),
		cancelledLastWeek: Number(row.cancelled_last_week),
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

export class WarehouseFacilityStatsRepository implements FacilityStatsRepository {
	constructor(private readonly warehouse: WarehouseParameterizedQueryable) {}

	async getWeeklyCounts(facilityIds: EntityId[]): Promise<FacilityWeeklyCounts> {
		const { rows } = await this.warehouse.query<WarehouseFacilityStatsRow>(
			FACILITY_WEEKLY_STATS_SQL,
			[facilityIds.map(Number)],
		);
		const [row] = rows;
		if (!row) throw new Error(`No stats row returned for facility ${facilityIds.join(", ")}.`);
		return toWeeklyCounts(row);
	}
}
