export interface WarehouseFacilityStatsRow {
	week_start: string;
	played_last_week: string | number;
	played_previous_week: string | number;
	played_last_28_days: string | number;
	scheduled_last_week: string | number;
	cancelled_last_week: string | number;
	upcoming_next_seven_days: string | number;
	last_played_date: string | null;
}

export interface WarehouseParameterizedQueryable {
	query<Row>(sql: string, values: unknown[]): Promise<{ rows: Row[] }>;
}
