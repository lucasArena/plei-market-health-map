export interface WarehouseDrillDownLocationRow {
	location_id: number | string;
	location_name: string | null;
	address: string | null;
	city: string | null;
	state: string | null;
	region_id: number | string | null;
	region_name: string | null;
	location_latitude: number | null;
	location_longitude: number | null;
	games: number | string;
	magic_games: number | string;
	organizer_games: number | string;
	partnership_games: number | string;
	company_id: number | string | null;
	company_logo: string | null;
}

export interface WarehouseQueryable {
	query<Row>(sql: string, values?: unknown[]): Promise<{ rows: Row[] }>;
}
