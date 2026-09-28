export interface WarehouseLocationRow {
	location_id: number | string;
	location_name: string | null;
	address: string | null;
	city: string | null;
	state: string | null;
	region_id: number | string | null;
	region_name: string | null;
	location_latitude: number | null;
	location_longitude: number | null;
}

export interface WarehouseQueryable {
	query<Row>(sql: string): Promise<{ rows: Row[] }>;
}
