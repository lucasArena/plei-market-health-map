export interface WarehouseFacilityReservationStatsRow {
	period_start: string;
	period_end: string;
	week_start: string;
	played_last_week: string | number;
	played_previous_week: string | number;
	played_last_28_days: string | number;
	played_previous_28_days: string | number;
	scheduled_last_28_days: string | number;
	scheduled_previous_28_days: string | number;
	scheduled_last_week: string | number;
	scheduled_previous_week: string | number;
	cancelled_last_week: string | number;
	cancelled_previous_week: string | number;
	cancelled_last_28_days: string | number;
	cancelled_previous_28_days: string | number;
	upcoming_next_seven_days: string | number;
	last_played_date: string | null;
	weekly_activity: WarehouseWeeklyActivityRow[];
	popular_times: WarehousePopularTimeRow[];
}

export interface WarehouseFacilityPlayerStatsRow {
	unique_players_last_week: string | number;
	unique_players_previous_week: string | number;
	activated_players_last_week: string | number;
	activated_players_previous_week: string | number;
	unique_players_last_28_days: string | number;
	unique_players_previous_28_days: string | number;
	activated_players_last_28_days: string | number;
	activated_players_previous_28_days: string | number;
	weekly_activated_players: WarehouseWeeklyActivatedPlayersRow[];
}

export interface WarehouseWeeklyActivatedPlayersRow {
	week_start: string;
	players: string | number;
}

export interface WarehouseWeeklyActivityRow {
	week_start: string;
	games_played: string | number;
}

export interface WarehousePopularTimeRow {
	day_of_week: string | number;
	time_period: string | number;
	games_played: string | number;
}

export interface WarehouseParameterizedQueryable {
	query<Row>(sql: string, values: unknown[]): Promise<{ rows: Row[] }>;
}

export interface WarehouseFacilityGameComparisonRow {
	location_id: number;
	played_last_week: string | number;
	played_previous_week: string | number;
	played_last_28_days: string | number;
	played_previous_28_days: string | number;
}
