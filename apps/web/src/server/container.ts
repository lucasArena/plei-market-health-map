import type {
	GetFacilityDetailInput,
	ListRecentLoginsInput,
	RecordLoginInput,
} from "@market-health-map/application";
import {
	makeGetFacilityDetail,
	makeListAppSessionHeatmap,
	makeListFacilities,
	makeListRecentLogins,
	makeRecordLogin,
} from "@market-health-map/application";
import {
	CachedAppSessionHeatmapRepository,
	CachedFacilityRepository,
	FixtureAppSessionHeatmapRepository,
	getPrismaClient,
	getWarehousePool,
	PrismaLoginEventRepository,
	SampleFacilityRepository,
	SampleFacilityStatsRepository,
	SystemClock,
	UuidGenerator,
	WarehouseAppSessionHeatmapRepository,
	WarehouseFacilityRepository,
	WarehouseFacilityStatsRepository,
} from "@market-health-map/infrastructure";
import { getServerEnv } from "@/env";

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
			stats: new SampleFacilityStatsRepository(clock),
		};
	}
	const pool = getWarehousePool(warehouseUrl);
	return {
		facilities: new CachedFacilityRepository(new WarehouseFacilityRepository(pool), clock),
		stats: new WarehouseFacilityStatsRepository(pool),
	};
}

function buildFacilities() {
	const repositories = buildFacilityRepositories();
	return {
		listFacilities: makeListFacilities({ facilities: repositories.facilities }),
		getFacilityDetail: makeGetFacilityDetail(repositories),
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
};

export function getContainer() {
	return container;
}
