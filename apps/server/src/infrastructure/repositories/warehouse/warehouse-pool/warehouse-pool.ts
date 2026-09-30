import type { WarehouseQueryable } from "@server/infrastructure/repositories/warehouse/warehouse-facility-repository/warehouse-facility-repository.types";
import type { WarehouseParameterizedQueryable } from "@server/infrastructure/repositories/warehouse/warehouse-facility-stats-repository/warehouse-facility-stats-repository.types";
import pg from "pg";

const globalForWarehouse = globalThis as unknown as { warehousePool?: pg.Pool };

export function getWarehousePool(
	connectionString: string,
): WarehouseQueryable & WarehouseParameterizedQueryable {
	globalForWarehouse.warehousePool ??= new pg.Pool({
		connectionString,
		max: 3,
		idleTimeoutMillis: 30_000,
		connectionTimeoutMillis: 10_000,
		statement_timeout: 20_000,
		options: "-c default_transaction_read_only=on",
	});
	return globalForWarehouse.warehousePool as unknown as WarehouseQueryable &
		WarehouseParameterizedQueryable;
}
