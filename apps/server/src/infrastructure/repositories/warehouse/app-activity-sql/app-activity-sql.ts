export const REGISTRATION_REGIONS_CTE = `region_coordinates AS (
  SELECT region_id,
    percentile_cont(0.5) WITHIN GROUP (ORDER BY location_latitude) AS lat,
    percentile_cont(0.5) WITHIN GROUP (ORDER BY location_longitude) AS lng
  FROM plei_gold.dim_location
  WHERE location_latitude BETWEEN -90 AND 90
    AND location_longitude BETWEEN -180 AND 180
    AND NOT (ABS(location_latitude) < 0.01 AND ABS(location_longitude) < 0.01)
  GROUP BY region_id
)`;

export const REGISTRATION_PERIOD_PREDICATE = `p.confirmed_at >= $1::date
  AND p.confirmed_at < $2::date
  AND p.players_type = 'pleiapp_player'`;

export function appActivitySql(registrations: boolean, sessions: boolean): string {
	const population = registrations
		? `SELECT p.player_id, p.region_id, 1 AS q_sessions
 FROM plei_gold.dim_player p
 JOIN region_coordinates c ON c.region_id = p.region_id
 WHERE ${REGISTRATION_PERIOD_PREDICATE}`
		: `SELECT s.player_id, p.region_id, s.q_sessions
 FROM plei_gold.players_behaviour s
 LEFT JOIN plei_gold.dim_player p ON p.player_id = s.player_id
 WHERE s.date >= $1::date AND s.date < $2::date ${sessions ? "" : "AND s.q_sessions > 0"}`;
	const aggregate = sessions ? "SUM(a.q_sessions)" : "COUNT(DISTINCT a.player_id)";
	const regions = registrations ? `${REGISTRATION_REGIONS_CTE}, ` : "";
	return `WITH ${regions}activity AS (${population})
 SELECT a.region_id, r.region_name, GROUPING(a.region_id) AS is_total,
 ${aggregate} AS value
 FROM activity a
 LEFT JOIN plei_gold.dim_region r ON r.region_id = a.region_id
 WHERE ($3::text IS NULL OR a.region_id::text = $3::text)
 GROUP BY GROUPING SETS ((a.region_id, r.region_name), ())`;
}
