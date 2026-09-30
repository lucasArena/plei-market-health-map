import type {
	GetFacilityDetailInput,
	GetFacilityPlayerStatsInput,
	GetFacilityReservationStatsInput,
	ListRecentLoginsInput,
	RecordLoginInput,
} from "@market-health-map/core/application";
import {
	makeGetFacilityDetail,
	makeGetFacilityPlayerStats,
	makeGetFacilityReservationStats,
	makeListAppSessionHeatmap,
	makeListFacilities,
	makeListRecentLogins,
	makeRecordLogin,
} from "@market-health-map/core/application";
import { getServerEnv } from "@server/env";
import { getPrismaClient } from "@server/infrastructure/database/prisma-client";
import { PrismaLoginEventRepository } from "@server/infrastructure/database/prisma-login-event-repository";
import { FixtureAppSessionHeatmapRepository } from "@server/infrastructure/sample/fixture-app-session-heatmap-repository";
import { SampleFacilityRepository } from "@server/infrastructure/sample/sample-facility-repository";
import { SampleFacilityStatsRepository } from "@server/infrastructure/sample/sample-facility-stats-repository";
import { SystemClock } from "@server/infrastructure/system/system-clock";
import { UuidGenerator } from "@server/infrastructure/system/uuid-generator";
import { CachedAppSessionHeatmapRepository } from "@server/infrastructure/warehouse/cached-app-session-heatmap-repository";
import { CachedFacilityRepository } from "@server/infrastructure/warehouse/cached-facility-repository";
import { CachedFacilityStatsRepository } from "@server/infrastructure/warehouse/cached-facility-stats-repository";
import { WarehouseAppSessionHeatmapRepository } from "@server/infrastructure/warehouse/warehouse-app-session-heatmap-repository";
import { WarehouseFacilityRepository } from "@server/infrastructure/warehouse/warehouse-facility-repository";
import { WarehouseFacilityStatsRepository } from "@server/infrastructure/warehouse/warehouse-facility-stats-repository";
import { getWarehousePool } from "@server/infrastructure/warehouse/warehouse-pool";

function buildLogins() {
	const databaseUrl = getServerEnv().DATABASE_URL;
	if (!databaseUrl) throw new Error("DATABASE_URL is required for login tracking.");
	const prisma = getPrismaClient(databaseUrl);
	const loginEvents = new PrismaLoginEventRepository(prisma);
	return {
		recordLogin: makeRecordLogin({
			loginEvents,
			ids: new UuidGenerator(),
			clock: new SystemClock(),
		}),
		listRecentLogins: makeListRecentLogins({ loginEvents }),
	};
}

function buildFacilityRepositories() {
	const warehouseUrl = getServerEnv().DATA_WAREHOUSE_URL;
	const clock = new SystemClock();
	if (!warehouseUrl) {
		return {
			facilities: new SampleFacilityRepository(),
			stats: new CachedFacilityStatsRepository(new SampleFacilityStatsRepository(clock), clock),
		};
	}
	const pool = getWarehousePool(warehouseUrl);
	return {
		facilities: new CachedFacilityRepository(new WarehouseFacilityRepository(pool), clock),
		stats: new CachedFacilityStatsRepository(new WarehouseFacilityStatsRepository(pool), clock),
	};
}

function buildFacilities() {
	const repositories = buildFacilityRepositories();
	return {
		listFacilities: makeListFacilities({ facilities: repositories.facilities }),
		getFacilityDetail: makeGetFacilityDetail(repositories),
		getFacilityReservationStats: makeGetFacilityReservationStats(repositories),
		getFacilityPlayerStats: makeGetFacilityPlayerStats(repositories),
	};
}

function buildAppSessionHeatmapRepository() {
	const warehouseUrl = getServerEnv().DATA_WAREHOUSE_URL;
	if (!warehouseUrl) return new FixtureAppSessionHeatmapRepository();
	return new CachedAppSessionHeatmapRepository(
		new WarehouseAppSessionHeatmapRepository(getWarehousePool(warehouseUrl)),
		new SystemClock(),
	);
}

function buildAppSessionHeatmap() {
	const listAppSessionHeatmap = makeListAppSessionHeatmap({
		appSessionHeatmap: buildAppSessionHeatmapRepository(),
	});
	return {
		listAppSessionHeatmap: async () => {
			try {
				return await listAppSessionHeatmap();
			} catch (error) {
				console.error(
					"[app-session-heatmap]",
					error instanceof Error ? error.stack : String(error),
				);
				return [];
			}
		},
	};
}

let logins: ReturnType<typeof buildLogins> | undefined;
let facilities: ReturnType<typeof buildFacilities> | undefined;
let appSessionHeatmap: ReturnType<typeof buildAppSessionHeatmap> | undefined;

function loginModule() {
	logins ??= buildLogins();
	return logins;
}

function facilityModule() {
	facilities ??= buildFacilities();
	return facilities;
}

function appSessionHeatmapModule() {
	appSessionHeatmap ??= buildAppSessionHeatmap();
	return appSessionHeatmap;
}

const container = {
	recordLogin: (input: RecordLoginInput) => loginModule().recordLogin(input),
	listRecentLogins: (input?: ListRecentLoginsInput) => loginModule().listRecentLogins(input),
	listFacilities: () => facilityModule().listFacilities(),
	listAppSessionHeatmap: () => appSessionHeatmapModule().listAppSessionHeatmap(),
	getFacilityDetail: (input: GetFacilityDetailInput) => facilityModule().getFacilityDetail(input),
	getFacilityReservationStats: (input: GetFacilityReservationStatsInput) =>
		facilityModule().getFacilityReservationStats(input),
	getFacilityPlayerStats: (input: GetFacilityPlayerStatsInput) =>
		facilityModule().getFacilityPlayerStats(input),
};

export function getContainer() {
	return container;
}
