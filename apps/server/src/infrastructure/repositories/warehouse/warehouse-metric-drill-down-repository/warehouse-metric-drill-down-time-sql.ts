import {
	isAppActivityMeasure,
	type MetricDrillDownQuery,
} from "@market-health-map/core/application";
import {
	REGISTRATION_PERIOD_PREDICATE,
	REGISTRATION_REGIONS_CTE,
} from "@server/infrastructure/repositories/warehouse/app-activity-sql/app-activity-sql";
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
import { metricDrillDownQualityPopulationSql } from "@server/infrastructure/repositories/warehouse/warehouse-metric-drill-down-repository/warehouse-metric-drill-down-sql";

// $1 start, $2 exclusive end, $3 departments, $4 location -> merged facility mapping,
// $5 market. All populations are read once; grouping sets compute independent totals.
export function metricDrillDownTimeSql(query: MetricDrillDownQuery): string {
	const measure = query.measure;
	const grain = query.grain === "range" ? "day" : query.grain;
	const app = isAppActivityMeasure(measure);
	const quality = measure === "almost-filled-rate" || measure === "incident-games-rate";
	const player = measure === "unique-players" || measure === "activated-players";
	let ctes = "";
	let population: string;
	let value = "count(distinct a.entity_id)";
	let numerator = "0";
	let denominator = "0";
	let errors = "0";
	if (app) {
		if (measure === "registrations") {
			ctes = `${REGISTRATION_REGIONS_CTE},`;
			population = `select p.confirmed_at::date as event_date, p.player_id::text as entity_id,
    null::text as department, null::text as facility_id, 1 as sessions
    from plei_gold.dim_player p join region_coordinates c on c.region_id = p.region_id
    where ${REGISTRATION_PERIOD_PREDICATE} and ($5::text is null or p.region_id::text = $5)`;
		} else {
			population = `select s.date::date as event_date, s.player_id::text as entity_id,
    null::text as department, null::text as facility_id, s.q_sessions as sessions
    from plei_gold.players_behaviour s left join plei_gold.dim_player p on p.player_id = s.player_id
    where s.date >= $1::date and s.date < $2::date
    ${measure === "unique-users" ? "and s.q_sessions > 0" : ""}
    and ($5::text is null or p.region_id::text = $5)`;
		}
		if (measure === "app-sessions") value = "coalesce(sum(a.sessions), 0)";
	} else {
		const mapping = "jsonb_each_text($4::jsonb) m";
		const department = "and (cardinality($3::text[]) = 0 or department = any($3::text[]))";
		if (quality) {
			ctes = `${metricDrillDownQualityPopulationSql(1, false, true)},`;
			population = `select c.*, c.game_date as event_date, c.reservation_id::text as entity_id, m.value as facility_id
    from classified c join ${mapping} on m.key = c.location_id::text where true ${department}`;
			const num = measure === "almost-filled-rate" ? "almost_filled" : "incident_games";
			const den = measure === "almost-filled-rate" ? "rostered_canceled" : "happened";
			numerator = `count(distinct a.entity_id) filter (where a.${num})`;
			denominator = `count(distinct a.entity_id) filter (where a.${den})`;
			errors =
				measure === "almost-filled-rate"
					? "count(distinct a.entity_id) filter (where a.missing_roster)"
					: "0";
			value = `100.0 * (${numerator}) / nullif((${denominator}), 0)`;
		} else if (player) {
			ctes = `${ORGANIZER_PARTNERS_CTE},`;
			population = `select f.date_played::date as event_date, f.player_id::text as entity_id,
    ${gameDepartmentCase("r")} as department, m.value as facility_id
    from plei_gold.fct_games_opened f
    left join plei_gold.dim_reservation r on r.reservation_id = f.reservation_id
    ${organizerPartnersJoin("r")}
    join ${mapping} on m.key = f.location_id::text
    where f.date_played >= $1::date and f.date_played < $2::date
    and ${QUALIFYING_OPENED_GAME_SQL} and ${OPENED_GAME_PLAYER_TYPE_SQL} and ${CONFIRMED_PLEIAPP_PLAYER_SQL}
    ${measure === "activated-players" ? "and f.player_lifecycle = 'Activated'" : ""}
    and (cardinality($3::text[]) = 0 or ${gameDepartmentCase("r")} = any($3::text[]))`;
		} else if (measure === "active-organizers") {
			ctes = `${ORGANIZER_PARTNERS_CTE},`;
			population = `select r.date_with_time::date as event_date, r.partner_id::text as entity_id,
    ${gameDepartmentCase("r")} as department, m.value as facility_id
    from plei_gold.dim_reservation r ${organizerPartnersJoin("r")}
    join ${mapping} on m.key = r.location_id::text
    where r.date_with_time::date >= $1::date and r.date_with_time::date < $2::date
    and op.partner_id is not null
    and r.reservation_type = 'OpenReservation' and not (${isOperationalCancellationSql("r")})
    and ${isPlayedGameSql("r")}
    and (cardinality($3::text[]) = 0 or ${gameDepartmentCase("r")} = any($3::text[]))`;
		} else {
			ctes = `${ORGANIZER_PARTNERS_CTE},`;
			population = `select r.date_with_time::date as event_date, r.reservation_id::text as entity_id,
    ${gameDepartmentCase("r")} as department, m.value as facility_id, ${isPlayedGameSql("r")} as played
    from plei_gold.dim_reservation r ${organizerPartnersJoin("r")}
    join ${mapping} on m.key = r.location_id::text
    where r.date_with_time::date >= $1::date and r.date_with_time::date < $2::date
    and r.reservation_type = 'OpenReservation' and not (${isOperationalCancellationSql("r")})
    and (cardinality($3::text[]) = 0 or ${gameDepartmentCase("r")} = any($3::text[]))`;
			if (measure === "games") value += " filter (where a.played)";
			if (measure === "active-facilities")
				value = "count(distinct a.facility_id) filter (where a.played)";
			if (measure === "confirmation-rate") {
				numerator = "count(distinct a.entity_id) filter (where a.played)";
				denominator = "count(distinct a.entity_id)";
				value = `100.0 * (${numerator}) / nullif((${denominator}), 0)`;
			}
		}
	}
	const membership =
		measure === "games" || measure === "active-facilities"
			? " and a.played"
			: measure === "incident-games-rate"
				? " and a.happened"
				: measure === "almost-filled-rate"
					? " and (a.rostered_canceled or a.missing_roster)"
					: "";
	return `with parameters as (select $1::date, $2::date, $3::text[], $4::jsonb, $5::text), ${ctes} population as (${population}), activity as (
 select p.*, date_trunc('${grain}', p.event_date)::date as bucket from population p
 )
 select a.bucket::text, a.department, grouping(a.bucket) as is_total,
 ${value} as value, ${numerator} as numerator, ${denominator} as denominator, ${errors} as data_errors,
 array_agg(distinct a.facility_id) filter (where a.facility_id is not null${membership}) as facility_ids
 from activity a
 group by grouping sets ((a.bucket), (a.bucket, a.department), (), (a.department))
 having grouping(a.department) = 1 or a.department is not null`;
}
