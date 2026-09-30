import type { FacilityRepository } from "@market-health-map/core/application";
import { asEntityId, Facility } from "@market-health-map/core/domain";
import { isTestFacility } from "@server/infrastructure/warehouse/is-test-facility";
import { mergeColocatedFacilities } from "@server/infrastructure/warehouse/merge-colocated-facilities";
import { isWithinServiceArea } from "@server/infrastructure/warehouse/service-area";
import type {
	WarehouseLocationRow,
	WarehouseQueryable,
} from "@server/infrastructure/warehouse/warehouse-facility.types";

export const ACTIVE_LOCATIONS_SQL = `
with bounds as (
  select date_trunc('week', current_date)::date as this_week
),
facility_activity as (
  select r.location_id, count(distinct r.reservation_id) as played_last_28_days
  from plei_gold.dim_reservation r
  cross join bounds b
  where r.reservation_type = 'OpenReservation'
    and r.confirmed
    and r.status <> 'cancelled'
    and r.date_with_time::date >= b.this_week - 28
    and r.date_with_time::date < b.this_week
  group by r.location_id
)
select l.location_id, l.location_name, l.address, l.city, l.state,
       l.region_id, r.region_name, l.location_latitude, l.location_longitude,
       coalesce(a.played_last_28_days, 0) as played_last_28_days
from plei_gold.dim_location l
left join plei_gold.dim_region r on r.region_id = l.region_id
left join facility_activity a on a.location_id = l.location_id
where l.deleted_at is null
  and l.location_latitude is not null
  and l.location_longitude is not null
  and exists (
    select 1
    from plei_gold.dim_reservation posted
    where posted.location_id = l.location_id
  )
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
			marketName: row.region_name ?? "Unassigned",
			name: row.location_name,
			address: formatAddress(row),
			location: { latitude, longitude },
			avatarUrl: null,
			metrics: {
				activePlayers: 0,
				gamesLastWeek: 0,
				gamesLast28Days: Number(row.played_last_28_days),
				utilization: 0,
			},
		});
	} catch {
		return null;
	}
}

export class WarehouseFacilityRepository implements FacilityRepository {
	constructor(private readonly warehouse: WarehouseQueryable) {}

	async listAll(): Promise<Facility[]> {
		const { rows } = await this.warehouse.query<WarehouseLocationRow>(ACTIVE_LOCATIONS_SQL);
		return mergeColocatedFacilities(
			rows.flatMap((row) => {
				const facility = toFacility(row);
				return facility ? [facility] : [];
			}),
		);
	}
}
