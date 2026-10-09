import type { GameDepartment } from "@market-health-map/core/domain";

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

export interface WarehouseDrillDownReservationRow {
	location_id: number | string;
	scheduled: number | string;
	played: number | string;
	scheduled_magic: number | string;
	scheduled_organizers: number | string;
	scheduled_partnerships: number | string;
	played_magic: number | string;
	played_organizers: number | string;
	played_partnerships: number | string;
}

export type WarehouseQualityCount =
	| "almost_filled"
	| "rostered_canceled"
	| "missing_roster"
	| "happened"
	| "incident_games";

export type WarehouseDrillDownQualityRow = { location_id: number | string } & Record<
	WarehouseQualityCount | `${WarehouseQualityCount}_${GameDepartment}`,
	number | string
>;

export interface WarehouseDrillDownPlayerRow {
	location_id: number | string;
	player_id: number | string;
	department: string | null;
}

export interface WarehouseQueryable {
	query<Row>(sql: string, values?: unknown[]): Promise<{ rows: Row[] }>;
}

export interface WarehouseAppActivityRow {
	region_id: number | string | null;
	region_name: string | null;
	is_total: number;
	value: number | string | null;
}
