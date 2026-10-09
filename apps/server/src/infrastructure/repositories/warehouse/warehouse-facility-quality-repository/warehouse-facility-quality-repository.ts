import type {
	FacilityLowReview,
	FacilityQuality,
	FacilityQualityRepository,
	FacilityQualityWindowCounts,
} from "@market-health-map/core/application";
import type { EntityId } from "@market-health-map/core/domain";
import {
	CONFIRMED_PLEIAPP_PLAYER_SQL,
	OPENED_GAME_PLAYER_TYPE_SQL,
	QUALIFYING_OPENED_GAME_SQL,
} from "@server/infrastructure/repositories/warehouse/reservation-game-sql/reservation-game-sql";
import {
	inDaysWindowSql,
	inLastDaysSql,
	inPreviousDaysSql,
	MONTH_DAYS,
	WEEK_DAYS,
} from "@server/infrastructure/repositories/warehouse/warehouse-day/warehouse-day";
import type {
	WarehouseFacilityLowReviewRow,
	WarehouseFacilityQualityCount,
	WarehouseFacilityQualityRow,
	WarehouseFacilityQualityWindow,
	WarehouseFacilityQualityWindowName,
} from "@server/infrastructure/repositories/warehouse/warehouse-facility-quality-repository/warehouse-facility-quality-repository.types";
import type { WarehouseParameterizedQueryable } from "@server/infrastructure/repositories/warehouse/warehouse-facility-stats-repository/warehouse-facility-stats-repository.types";
import { metricDrillDownQualityPopulationSql } from "@server/infrastructure/repositories/warehouse/warehouse-metric-drill-down-repository/warehouse-metric-drill-down-sql";

export const LOW_REVIEW_LIMIT = 5;

export const LOW_REVIEW_RATE = 3;

export const QUALITY_WINDOWS = [
	{ name: "last_week", days: WEEK_DAYS, windowsAgo: 0 },
	{ name: "previous_week", days: WEEK_DAYS, windowsAgo: 1 },
	{ name: "last_28_days", days: MONTH_DAYS, windowsAgo: 0 },
	{ name: "previous_28_days", days: MONTH_DAYS, windowsAgo: 1 },
] as const satisfies readonly WarehouseFacilityQualityWindow[];

const PLAYER_WINDOW_DAYS = [WEEK_DAYS, MONTH_DAYS] as const;

const PLAYER_WINDOWS_AGO = [0, 1, 2] as const;

function inWindowSql(column: string, window: WarehouseFacilityQualityWindow): string {
	const windowSql = window.windowsAgo === 0 ? inLastDaysSql : inPreviousDaysSql;
	return windowSql(column, "b.today", window.days);
}

function playedInSql(days: number, windowsAgo: number): string {
	return `played_${days}_${windowsAgo}`;
}

function countColumn(
	count: WarehouseFacilityQualityCount,
	window: WarehouseFacilityQualityWindow,
	expression: string,
): string {
	return `${expression} as ${count}_${window.name}`;
}

function gameCountColumns(window: WarehouseFacilityQualityWindow): string[] {
	const inWindow = inWindowSql("c.game_date", window);
	const games = (condition: string) =>
		`count(distinct c.reservation_id) filter (where ${condition} and ${inWindow})`;
	return [
		countColumn("played_games", window, games("c.happened")),
		countColumn("roster_games", window, games("c.happened and pr.real_player_count is not null")),
		countColumn(
			"roster_players",
			window,
			`coalesce(sum(pr.real_player_count) filter (where c.happened and ${inWindow}), 0)`,
		),
		countColumn("waitlist_games", window, games("c.happened and wg.reservation_id is not null")),
		countColumn("rostered_cancelled_games", window, games("c.rostered_canceled")),
		countColumn("almost_filled_games", window, games("c.almost_filled")),
		countColumn("incident_games", window, games("c.incident_games")),
	];
}

function reviewCountColumns(window: WarehouseFacilityQualityWindow): string[] {
	const inWindow = inWindowSql("gr.game_date", window);
	return [
		countColumn("rating_count", window, `count(gr.review_id) filter (where ${inWindow})`),
		countColumn("rating_total", window, `coalesce(sum(gr.rate) filter (where ${inWindow}), 0)`),
	];
}

function playerCountColumns(window: WarehouseFacilityQualityWindow): string[] {
	const current = `pw.${playedInSql(window.days, window.windowsAgo)}`;
	const earlier = `pw.${playedInSql(window.days, window.windowsAgo + 1)}`;
	return [
		countColumn("players", window, `count(*) filter (where ${current})`),
		countColumn("returning_players", window, `count(*) filter (where ${current} and ${earlier})`),
	];
}

function playerWindowColumns(): string {
	return PLAYER_WINDOW_DAYS.flatMap((days) =>
		PLAYER_WINDOWS_AGO.map(
			(windowsAgo) =>
				`bool_or(${inDaysWindowSql("f.date_played", "b.today", days, windowsAgo)}) as ${playedInSql(days, windowsAgo)}`,
		),
	).join(",\n    ");
}

function columns(build: (window: WarehouseFacilityQualityWindow) => string[]): string {
	return QUALITY_WINDOWS.flatMap(build).join(",\n    ");
}

const PLAYER_HISTORY_DAYS = MONTH_DAYS * PLAYER_WINDOWS_AGO.length;

export const FACILITY_QUALITY_SQL = `${metricDrillDownQualityPopulationSql(MONTH_DAYS * 2, false)},
played_rosters as (
  select p.reservation_id, max(p.real_player_count) as real_player_count
  from plei_gold.fct_payouts p
  where p.deleted_at is null
    and p.reservation_id in (select c.reservation_id from classified c where c.happened)
  group by p.reservation_id
),
waitlisted_games as (
  select distinct w.reservation_id
  from plei_gold.fct_waitlist w
  where w.reservation_id in (select c.reservation_id from classified c where c.happened)
),
game_reviews as (
  select v.review_id, v.rate, v.created_at, v.title_message, c.game_date
  from plei_gold.dim_review v
  join classified c on c.reservation_id = v.reservation_id and c.happened
),
facility_players as (
  select distinct f.player_id, f.date_played
  from plei_gold.fct_games_opened f
  cross join bounds b
  where f.location_id = any($1::int[])
    and f.date_played >= b.today - ${PLAYER_HISTORY_DAYS}
    and f.date_played < b.today
    and ${QUALIFYING_OPENED_GAME_SQL}
    and ${OPENED_GAME_PLAYER_TYPE_SQL}
    and ${CONFIRMED_PLEIAPP_PLAYER_SQL}
),
player_windows as (
  select f.player_id,
    ${playerWindowColumns()}
  from facility_players f
  cross join bounds b
  group by f.player_id
),
game_counts as (
  select
    ${columns(gameCountColumns)}
  from classified c
  cross join bounds b
  left join played_rosters pr on pr.reservation_id = c.reservation_id
  left join waitlisted_games wg on wg.reservation_id = c.reservation_id
),
review_counts as (
  select
    ${columns(reviewCountColumns)}
  from game_reviews gr
  cross join bounds b
),
player_counts as (
  select
    ${columns(playerCountColumns)}
  from player_windows pw
),
low_reviews as (
  select gr.review_id::text as id, gr.rate, gr.created_at::date::text as date,
    nullif(btrim(gr.title_message), '') as title
  from game_reviews gr
  cross join bounds b
  where gr.rate < ${LOW_REVIEW_RATE}
    and ${inLastDaysSql("gr.game_date", "b.today", MONTH_DAYS)}
  order by gr.created_at desc, gr.review_id desc
  limit ${LOW_REVIEW_LIMIT}
)
select gc.*, rc.*, pc.*,
  (select json_agg(json_build_object(
    'id', lr.id,
    'rate', lr.rate,
    'date', lr.date,
    'title', lr.title
  ) order by lr.date desc, lr.id desc) from low_reviews lr) as low_reviews
from game_counts gc
cross join review_counts rc
cross join player_counts pc`;

function windowCounts(
	row: WarehouseFacilityQualityRow,
	name: WarehouseFacilityQualityWindowName,
): FacilityQualityWindowCounts {
	const count = (key: WarehouseFacilityQualityCount) => Number(row[`${key}_${name}`] ?? 0);
	return {
		playedGames: count("played_games"),
		rosterGames: count("roster_games"),
		rosterPlayers: count("roster_players"),
		waitlistGames: count("waitlist_games"),
		rosteredCancelledGames: count("rostered_cancelled_games"),
		almostFilledGames: count("almost_filled_games"),
		incidentGames: count("incident_games"),
		ratingCount: count("rating_count"),
		ratingTotal: count("rating_total"),
		players: count("players"),
		returningPlayers: count("returning_players"),
	};
}

function toLowReview(row: WarehouseFacilityLowReviewRow): FacilityLowReview {
	return { id: String(row.id), rate: Number(row.rate), date: row.date, title: row.title };
}

export function toFacilityQuality(row: WarehouseFacilityQualityRow): FacilityQuality {
	return {
		periods: {
			week: {
				current: windowCounts(row, "last_week"),
				previous: windowCounts(row, "previous_week"),
			},
			month: {
				current: windowCounts(row, "last_28_days"),
				previous: windowCounts(row, "previous_28_days"),
			},
		},
		lowReviews: (row.low_reviews ?? []).map(toLowReview),
	};
}

export class WarehouseFacilityQualityRepository implements FacilityQualityRepository {
	constructor(private readonly warehouse: WarehouseParameterizedQueryable) {}

	async getQuality(facilityIds: EntityId[], today: string): Promise<FacilityQuality> {
		const { rows } = await this.warehouse.query<WarehouseFacilityQualityRow>(FACILITY_QUALITY_SQL, [
			facilityIds.map(Number),
			today,
		]);
		const [row] = rows;
		if (!row) {
			throw new Error(`No quality row returned for facility ${facilityIds.join(", ")}.`);
		}
		return toFacilityQuality(row);
	}
}
