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
  select r.reservation_id, r.date_with_time::date as game_date, r.status, r.confirmed
  from plei_gold.dim_reservation r
  where r.location_id = any($1::int[])
    and r.reservation_type = 'OpenReservation'
    and not (
      r.status = 'cancelled'
      and r.cancellation_reason in ('Recurring game series', 'Operational changes')
    )
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
  ))::text as last_played_date
from bounds b
left join games g on true
group by b.this_week, b.today`;

export function toWeeklyCounts(row: WarehouseFacilityStatsRow): FacilityWeeklyCounts {
	return {
		weekStart: row.week_start,
		playedLastWeek: Number(row.played_last_week),
		playedPreviousWeek: Number(row.played_previous_week),
		playedLast28Days: Number(row.played_last_28_days),
		scheduledLastWeek: Number(row.scheduled_last_week),
		cancelledLastWeek: Number(row.cancelled_last_week),
		upcomingNextSevenDays: Number(row.upcoming_next_seven_days),
		lastPlayedDate: row.last_played_date,
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
