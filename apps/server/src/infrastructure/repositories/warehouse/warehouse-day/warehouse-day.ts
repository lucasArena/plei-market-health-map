/**
 * The zone whose calendar decides "today" in warehouse queries. `date_with_time` is the game's
 * local wall-clock time with no zone, so a window must cut at local midnight. The service area
 * runs from Hawaii (UTC-10) to Brazil (UTC-3); today in the westernmost zone is never ahead of
 * any facility's local today, so "the 28 full days ending yesterday" never takes in a partial
 * local today. East of Hawaii the window can trail by one day for a few hours after midnight.
 * The session time zone is not set on the pool, so `current_date` alone would follow the
 * server default.
 */
export const WAREHOUSE_DAY_TIME_ZONE = "Pacific/Honolulu";

/** SQL for today's date in `WAREHOUSE_DAY_TIME_ZONE`, independent of the session time zone. */
export const WAREHOUSE_TODAY_SQL = `(now() at time zone '${WAREHOUSE_DAY_TIME_ZONE}')::date`;
