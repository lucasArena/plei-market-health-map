import type {
	MarketAudienceCounts,
	MarketAudiencePeriodCounts,
	MarketAudienceRepository,
} from "@market-health-map/core/application";
import {
	inLastDaysSql,
	inPreviousDaysSql,
	MONTH_DAYS,
	todayParameterSql,
	WEEK_DAYS,
} from "@server/infrastructure/repositories/warehouse/warehouse-day/warehouse-day";
import type { WarehouseParameterizedQueryable } from "@server/infrastructure/repositories/warehouse/warehouse-facility-stats-repository/warehouse-facility-stats-repository.types";
import type { WarehouseMarketAudienceRow } from "@server/infrastructure/repositories/warehouse/warehouse-market-audience-repository/warehouse-market-audience-repository.types";

const REGION_PARAMETER = "$2::bigint";

export const MARKET_AUDIENCE_SQL = `
with bounds as (
  select ${todayParameterSql(1)} as today
),
active_days as (
  select s.player_id, s.date
  from plei_gold.players_behaviour s
  where s.date >= ${todayParameterSql(1)} - ${MONTH_DAYS * 2}
    and s.date < ${todayParameterSql(1)}
    and (${REGION_PARAMETER} is null or s.plei_region = (
      select r.region_name from plei_gold.dim_region r where r.region_id = ${REGION_PARAMETER}
    ))
),
active_counts as (
  select
    count(distinct a.player_id) filter (
      where ${inLastDaysSql("a.date", "b.today", WEEK_DAYS)}
    ) as active_last_week,
    count(distinct a.player_id) filter (
      where ${inPreviousDaysSql("a.date", "b.today", WEEK_DAYS)}
    ) as active_previous_week,
    count(distinct a.player_id) filter (
      where ${inLastDaysSql("a.date", "b.today", MONTH_DAYS)}
    ) as active_last_28_days,
    count(distinct a.player_id) filter (
      where ${inPreviousDaysSql("a.date", "b.today", MONTH_DAYS)}
    ) as active_previous_28_days
  from bounds b
  left join active_days a on true
  group by b.today
),
registration_counts as (
  select
    count(distinct p.player_id) filter (
      where ${inLastDaysSql("p.confirmed_at", "b.today", WEEK_DAYS)}
    ) as registrations_last_week,
    count(distinct p.player_id) filter (
      where ${inPreviousDaysSql("p.confirmed_at", "b.today", WEEK_DAYS)}
    ) as registrations_previous_week,
    count(distinct p.player_id) filter (
      where ${inLastDaysSql("p.confirmed_at", "b.today", MONTH_DAYS)}
    ) as registrations_last_28_days,
    count(distinct p.player_id) filter (
      where ${inPreviousDaysSql("p.confirmed_at", "b.today", MONTH_DAYS)}
    ) as registrations_previous_28_days
  from bounds b
  left join plei_gold.dim_player p
    on p.players_type = 'pleiapp_player'
    and p.confirmed_at >= b.today - ${MONTH_DAYS * 2}
    and p.confirmed_at < b.today
    and (${REGION_PARAMETER} is null or p.region_id = ${REGION_PARAMETER})
  group by b.today
)
select
  ac.active_last_week,
  ac.active_previous_week,
  ac.active_last_28_days,
  ac.active_previous_28_days,
  rc.registrations_last_week,
  rc.registrations_previous_week,
  rc.registrations_last_28_days,
  rc.registrations_previous_28_days
from active_counts ac
cross join registration_counts rc`;

const EMPTY_PERIOD: MarketAudiencePeriodCounts = {
	activeUsers: 0,
	activeUsersPrevious: 0,
	registrations: 0,
	registrationsPrevious: 0,
};

const REGION_ID_PATTERN = /^\d+$/;

export function toMarketAudienceCounts(row: WarehouseMarketAudienceRow): MarketAudienceCounts {
	return {
		week: {
			activeUsers: Number(row.active_last_week),
			activeUsersPrevious: Number(row.active_previous_week),
			registrations: Number(row.registrations_last_week),
			registrationsPrevious: Number(row.registrations_previous_week),
		},
		month: {
			activeUsers: Number(row.active_last_28_days),
			activeUsersPrevious: Number(row.active_previous_28_days),
			registrations: Number(row.registrations_last_28_days),
			registrationsPrevious: Number(row.registrations_previous_28_days),
		},
	};
}

export class WarehouseMarketAudienceRepository implements MarketAudienceRepository {
	constructor(private readonly warehouse: WarehouseParameterizedQueryable) {}

	async getAudience(marketId: string | null, today: string): Promise<MarketAudienceCounts> {
		if (marketId !== null && !REGION_ID_PATTERN.test(marketId)) {
			return { week: EMPTY_PERIOD, month: EMPTY_PERIOD };
		}
		const { rows } = await this.warehouse.query<WarehouseMarketAudienceRow>(MARKET_AUDIENCE_SQL, [
			today,
			marketId,
		]);
		const [row] = rows;
		if (!row) throw new Error(`No audience row returned for market ${marketId ?? "all"}.`);
		return toMarketAudienceCounts(row);
	}
}
