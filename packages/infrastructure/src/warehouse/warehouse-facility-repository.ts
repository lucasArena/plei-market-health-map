import { isTestFacility } from "@infra/warehouse/is-test-facility";
import { isWithinServiceArea } from "@infra/warehouse/service-area";
import type {
	WarehouseLocationRow,
	WarehouseQueryable,
} from "@infra/warehouse/warehouse-facility.types";
import type { FacilityRepository } from "@market-health-map/application";
import { asEntityId, Facility } from "@market-health-map/domain";

export const ACTIVE_LOCATIONS_SQL = `
select l.location_id, l.location_name, l.address, l.city, l.state,
       l.region_id, r.region_name, l.location_latitude, l.location_longitude
from plei_gold.dim_location l
left join plei_gold.dim_region r on r.region_id = l.region_id
where l.deleted_at is null
  and l.location_latitude is not null
  and l.location_longitude is not null
order by l.location_id`;

const UNASSIGNED_MARKET = "unassigned";

function formatAddress(row: WarehouseLocationRow): string {
	const parts = [row.address, row.city, row.state].map((part) => part?.trim()).filter(Boolean);
	return parts.length > 0 ? parts.join(", ") : (row.region_name ?? "—");
}

export function toFacility(row: WarehouseLocationRow): Facility | null {
	if (!row.location_name?.trim() || isTestFacility(row.location_name, row.region_name)) return null;
	const latitude = Number(row.location_latitude);
	const longitude = Number(row.location_longitude);
	if (!isWithinServiceArea(latitude, longitude)) return null;
	try {
		return Facility.create({
			id: asEntityId(String(row.location_id)),
			marketId: asEntityId(row.region_id === null ? UNASSIGNED_MARKET : String(row.region_id)),
			name: row.location_name,
			address: formatAddress(row),
			location: { latitude, longitude },
			avatarUrl: null,
			metrics: { activePlayers: 0, gamesLastWeek: 0, utilization: 0 },
		});
	} catch {
		return null;
	}
}

export class WarehouseFacilityRepository implements FacilityRepository {
	constructor(private readonly warehouse: WarehouseQueryable) {}

	async listAll(): Promise<Facility[]> {
		const { rows } = await this.warehouse.query<WarehouseLocationRow>(ACTIVE_LOCATIONS_SQL);
		return rows.flatMap((row) => {
			const facility = toFacility(row);
			return facility ? [facility] : [];
		});
	}
}
