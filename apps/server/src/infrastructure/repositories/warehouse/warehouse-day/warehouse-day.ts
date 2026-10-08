export const WAREHOUSE_DAY_TIME_ZONE = "Pacific/Honolulu";

export const WAREHOUSE_TODAY_SQL = `(now() at time zone '${WAREHOUSE_DAY_TIME_ZONE}')::date`;
