import type {
	DrillDownFacilityFact,
	DrillDownMeasure,
	MetricDrillDownQuery,
	MetricDrillDownRepository,
	MetricDrillDownView,
} from "@market-health-map/core/application";
import {
	aggregateCountDrillDown,
	aggregateDrillDownFromFacts,
	DRILL_DOWN_MEASURE_KIND,
	DRILL_DOWN_RANGE_DAYS,
	isAppActivityMeasure,
} from "@market-health-map/core/application";
import {
	asEntityId,
	Facility,
	GAME_DEPARTMENTS,
	type GameDepartment,
	type GameDepartmentCounts,
	statsWindow,
} from "@market-health-map/core/domain";
import { appActivitySql } from "@server/infrastructure/repositories/warehouse/app-activity-sql/app-activity-sql";
import { companyLogoUrl } from "@server/infrastructure/repositories/warehouse/company-logo-url/company-logo-url";
import {
	gameDepartmentCase,
	ORGANIZER_PARTNERS_CTE,
	organizerPartnersJoin,
} from "@server/infrastructure/repositories/warehouse/game-department-sql/game-department-sql";
import { isIgnoredFacility } from "@server/infrastructure/repositories/warehouse/is-ignored-facility/is-ignored-facility";
import { isTestFacility } from "@server/infrastructure/repositories/warehouse/is-test-facility/is-test-facility";
import { mergeColocatedFacilities } from "@server/infrastructure/repositories/warehouse/merge-colocated-facilities/merge-colocated-facilities";
import { isWithinServiceArea } from "@server/infrastructure/repositories/warehouse/service-area/service-area";
import {
	inLastDaysSql,
	todayParameterSql,
} from "@server/infrastructure/repositories/warehouse/warehouse-day/warehouse-day";
import type {
	WarehouseAppActivityRow,
	WarehouseDrillDownLocationRow,
	WarehouseDrillDownPlayerRow,
	WarehouseDrillDownQualityRow,
	WarehouseDrillDownReservationRow,
	WarehouseQualityCount,
	WarehouseQueryable,
} from "@server/infrastructure/repositories/warehouse/warehouse-metric-drill-down-repository/warehouse-metric-drill-down-repository.types";
import {
	metricDrillDownFacilitiesSql,
	metricDrillDownPlayerSql,
	metricDrillDownQualitySql,
	metricDrillDownReservationSql,
} from "@server/infrastructure/repositories/warehouse/warehouse-metric-drill-down-repository/warehouse-metric-drill-down-sql";

const GAME_DATE = "g.date_with_time::date";
const UNASSIGNED_MARKET = "unassigned";
const QUALITY_MEASURES: readonly DrillDownMeasure[] = ["almost-filled-rate", "incident-games-rate"];

export function metricDrillDownLocationsSql(days: number): string {
	return `
with bounds as (
  select ${todayParameterSql(1)} as today
),
${ORGANIZER_PARTNERS_CTE},
classified_games as (
  select r.*, ${gameDepartmentCase("r")} as department
  from plei_gold.dim_reservation r
  ${organizerPartnersJoin("r")}
),
facility_activity as (
  select g.location_id,
         count(distinct g.reservation_id) as games,
         count(distinct g.reservation_id) filter (where g.department = 'magic') as magic_games,
         count(distinct g.reservation_id) filter (where g.department = 'organizers') as organizer_games,
         count(distinct g.reservation_id) filter (where g.department = 'partnerships') as partnership_games
  from classified_games g
  cross join bounds b
  where g.reservation_type = 'OpenReservation'
    and g.confirmed
    and g.status <> 'cancelled'
    and ${inLastDaysSql(GAME_DATE, "b.today", days)}
  group by g.location_id
)
select l.location_id, l.location_name, l.address, l.city, l.state,
       l.region_id, r.region_name, l.location_latitude, l.location_longitude,
       coalesce(a.games, 0) as games,
       coalesce(a.magic_games, 0) as magic_games,
       coalesce(a.organizer_games, 0) as organizer_games,
       coalesce(a.partnership_games, 0) as partnership_games,
       c.id as company_id, c.logo as company_logo
from plei_gold.dim_location l
left join plei_gold.dim_region r on r.region_id = l.region_id
left join facility_activity a on a.location_id = l.location_id
left join plei_bronze.companies c on c.id = l.company_id and c.deleted_at is null
where l.deleted_at is null
  and l.location_latitude is not null
  and l.location_longitude is not null
  and exists (
    select 1
    from plei_gold.dim_reservation posted
    where posted.location_id = l.location_id
  )
order by l.location_id`;
}

function formatAddress(row: WarehouseDrillDownLocationRow): string {
	const parts = [row.address, row.city, row.state].map((part) => part?.trim()).filter(Boolean);
	return parts.length > 0 ? parts.join(", ") : (row.region_name ?? "—");
}

export function toDrillDownFacility(row: WarehouseDrillDownLocationRow): Facility | null {
	if (
		!row.location_name?.trim() ||
		isTestFacility(row.location_name, row.region_name) ||
		isIgnoredFacility(row.location_name)
	) {
		return null;
	}
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
			avatarUrl: companyLogoUrl(row.company_id, row.company_logo),
			metrics: {
				activePlayers: 0,
				gamesLastWeek: 0,
				gamesLast28Days: Number(row.games),
				gamesByDepartment: {
					magic: Number(row.magic_games),
					organizers: Number(row.organizer_games),
					partnerships: Number(row.partnership_games),
				},
				utilization: 0,
			},
		});
	} catch {
		return null;
	}
}

export function toDrillDownFacilityFact(facility: Facility): DrillDownFacilityFact {
	const props = facility.toJSON();
	return {
		id: props.id,
		name: props.name,
		marketId: props.marketId,
		marketName: facility.marketName,
		games: props.metrics.gamesLast28Days,
		gamesByDepartment: props.metrics.gamesByDepartment ?? null,
	};
}

function emptyDepartments(): GameDepartmentCounts {
	return { magic: 0, organizers: 0, partnerships: 0 };
}

function asDepartment(value: string | null): GameDepartment | null {
	return GAME_DEPARTMENTS.includes(value as GameDepartment) ? (value as GameDepartment) : null;
}

export function reservationFactsFrom(
	facilities: readonly Facility[],
	rows: readonly WarehouseDrillDownReservationRow[],
): DrillDownFacilityFact[] {
	const byLocation = new Map(rows.map((row) => [String(row.location_id), row]));
	return facilities.map((facility) => {
		const members = facility.memberIds.map(String);
		const played = emptyDepartments();
		const scheduled = emptyDepartments();
		let playedTotal = 0;
		let scheduledTotal = 0;
		for (const id of members) {
			const row = byLocation.get(id);
			if (!row) continue;
			playedTotal += Number(row.played);
			scheduledTotal += Number(row.scheduled);
			played.magic += Number(row.played_magic);
			played.organizers += Number(row.played_organizers);
			played.partnerships += Number(row.played_partnerships);
			scheduled.magic += Number(row.scheduled_magic);
			scheduled.organizers += Number(row.scheduled_organizers);
			scheduled.partnerships += Number(row.scheduled_partnerships);
		}
		const props = facility.toJSON();
		return {
			id: props.id,
			name: props.name,
			marketId: props.marketId,
			marketName: facility.marketName,
			games: playedTotal,
			gamesByDepartment: played,
			scheduled: scheduledTotal,
			scheduledByDepartment: scheduled,
		};
	});
}

export function qualityFactsFrom(
	facilities: readonly Facility[],
	rows: readonly WarehouseDrillDownQualityRow[],
): DrillDownFacilityFact[] {
	const byLocation = new Map(rows.map((row) => [String(row.location_id), row]));
	return facilities.map((facility) => {
		const memberRows = facility.memberIds.flatMap((id) => {
			const row = byLocation.get(String(id));
			return row ? [row] : [];
		});
		const total = (name: WarehouseQualityCount) =>
			memberRows.reduce((sum, row) => sum + Number(row[name]), 0);
		const byDepartment = (name: WarehouseQualityCount): GameDepartmentCounts => {
			const counts = emptyDepartments();
			for (const row of memberRows)
				for (const department of GAME_DEPARTMENTS)
					counts[department] += Number(row[`${name}_${department}`]);
			return counts;
		};
		const props = facility.toJSON();
		return {
			id: props.id,
			name: props.name,
			marketId: props.marketId,
			marketName: facility.marketName,
			games: total("happened"),
			gamesByDepartment: byDepartment("happened"),
			almostFilled: total("almost_filled"),
			almostFilledByDepartment: byDepartment("almost_filled"),
			rosteredCanceled: total("rostered_canceled"),
			rosteredCanceledByDepartment: byDepartment("rostered_canceled"),
			missingRoster: total("missing_roster"),
			missingRosterByDepartment: byDepartment("missing_roster"),
			incidentGames: total("incident_games"),
			incidentGamesByDepartment: byDepartment("incident_games"),
		};
	});
}

export function playerFactsFrom(
	facilities: readonly Facility[],
	rows: readonly WarehouseDrillDownPlayerRow[],
	measure: "unique-players" | "activated-players",
): DrillDownFacilityFact[] {
	const byLocation = new Map<string, WarehouseDrillDownPlayerRow[]>();
	for (const row of rows) {
		const id = String(row.location_id);
		byLocation.set(id, [...(byLocation.get(id) ?? []), row]);
	}
	return facilities.map((facility) => {
		const keys = new Set<string>();
		const departments: Record<GameDepartment, Set<string>> = {
			magic: new Set(),
			organizers: new Set(),
			partnerships: new Set(),
		};
		for (const id of facility.memberIds.map(String)) {
			for (const row of byLocation.get(id) ?? []) {
				const playerId = String(row.player_id);
				keys.add(playerId);
				const department = asDepartment(row.department);
				if (department) departments[department].add(playerId);
			}
		}
		const props = facility.toJSON();
		const playerIds = [...keys];
		const playerIdsByDepartment = {
			magic: [...departments.magic],
			organizers: [...departments.organizers],
			partnerships: [...departments.partnerships],
		};
		return {
			id: props.id,
			name: props.name,
			marketId: props.marketId,
			marketName: facility.marketName,
			games: null,
			gamesByDepartment: null,
			...(measure === "unique-players"
				? { uniquePlayerIds: playerIds, uniquePlayerIdsByDepartment: playerIdsByDepartment }
				: {
						activatedPlayerIds: playerIds,
						activatedPlayerIdsByDepartment: playerIdsByDepartment,
					}),
		};
	});
}

export class WarehouseMetricDrillDownRepository implements MetricDrillDownRepository {
	constructor(private readonly warehouse: WarehouseQueryable) {}

	async group(query: MetricDrillDownQuery): Promise<MetricDrillDownView> {
		const days = DRILL_DOWN_RANGE_DAYS[query.range];
		const { start, end } = statsWindow(query.today, days);
		if (isAppActivityMeasure(query.measure)) {
			const { rows } = await this.warehouse.query<WarehouseAppActivityRow>(
				appActivitySql(query.measure === "registrations", query.measure === "app-sessions"),
				[start, query.today, query.marketId ?? null],
			);
			const total = rows.find((row) => row.is_total === 1);
			return {
				measure: query.measure,
				range: query.range,
				kind: DRILL_DOWN_MEASURE_KIND[query.measure],
				start,
				end,
				total: total?.value == null ? null : Number(total.value),
				rows: rows
					.filter((row) => row.is_total === 0)
					.map((row) => ({
						id: row.region_id == null ? "unassigned" : String(row.region_id),
						name: row.region_name ?? "Unassigned",
						value: row.value == null ? null : Number(row.value),
						departments: null,
					})),
			};
		}
		if (query.measure === "games" || query.measure === "active-facilities")
			return this.groupCounts(query, days, start, end);
		const facilities = await this.listMergedFacilities();
		const scoped = facilities.filter(
			(facility) =>
				(!query.marketId || facility.marketId === query.marketId) &&
				(!query.facilityId || facility.id === query.facilityId),
		);
		const locationIds = scoped.flatMap((facility) => facility.memberIds.map(Number));
		const byDepartment = query.departments.length > 0;
		const params = byDepartment
			? [locationIds, query.today, query.departments]
			: [locationIds, query.today];
		if (query.measure === "unique-players" || query.measure === "activated-players") {
			const { rows } = locationIds.length
				? await this.warehouse.query<WarehouseDrillDownPlayerRow>(
						metricDrillDownPlayerSql(days, query.measure === "activated-players", byDepartment),
						params,
					)
				: { rows: [] };
			return aggregateDrillDownFromFacts({
				facilities: playerFactsFrom(scoped, rows, query.measure),
				measure: query.measure,
				slice: query.slice,
				marketId: query.marketId,
				facilityId: query.facilityId,
				department: query.department,
				gameDepartments: query.departments,
				start,
				end,
				range: query.range,
			});
		}
		if (QUALITY_MEASURES.includes(query.measure)) {
			const { rows } = locationIds.length
				? await this.warehouse.query<WarehouseDrillDownQualityRow>(
						metricDrillDownQualitySql(days, byDepartment),
						params,
					)
				: { rows: [] };
			return aggregateDrillDownFromFacts({
				facilities: qualityFactsFrom(scoped, rows),
				measure: query.measure,
				slice: query.slice,
				marketId: query.marketId,
				facilityId: query.facilityId,
				department: query.department,
				gameDepartments: query.departments,
				start,
				end,
				range: query.range,
			});
		}
		const { rows } = locationIds.length
			? await this.warehouse.query<WarehouseDrillDownReservationRow>(
					metricDrillDownReservationSql(days, byDepartment),
					params,
				)
			: { rows: [] };
		return aggregateDrillDownFromFacts({
			facilities: reservationFactsFrom(scoped, rows),
			measure: query.measure,
			slice: query.slice,
			marketId: query.marketId,
			facilityId: query.facilityId,
			department: query.department,
			gameDepartments: query.departments,
			start,
			end,
			range: query.range,
		});
	}

	private async groupCounts(
		query: MetricDrillDownQuery,
		days: number,
		start: string,
		end: string,
	): Promise<MetricDrillDownView> {
		const { rows } = await this.warehouse.query<WarehouseDrillDownLocationRow>(
			metricDrillDownLocationsSql(days),
			[query.today],
		);
		const facilities = mergeColocatedFacilities(
			rows.flatMap((row) => {
				const facility = toDrillDownFacility(row);
				return facility ? [facility] : [];
			}),
		).map(toDrillDownFacilityFact);
		return aggregateCountDrillDown({
			facilities,
			measure: query.measure,
			slice: query.slice,
			marketId: query.marketId,
			facilityId: query.facilityId,
			department: query.department,
			gameDepartments: query.departments,
			start,
			end,
			range: query.range,
		});
	}

	private async listMergedFacilities(): Promise<Facility[]> {
		const { rows } = await this.warehouse.query<WarehouseDrillDownLocationRow>(
			metricDrillDownFacilitiesSql(),
		);
		return mergeColocatedFacilities(
			rows.flatMap((row) => {
				const facility = toDrillDownFacility(row);
				return facility ? [facility] : [];
			}),
		);
	}
}
