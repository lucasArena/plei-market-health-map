import type { ListRecentLoginsInput, RecordLoginInput } from "@market-health-map/application";
import {
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
	SystemClock,
	UuidGenerator,
	WarehouseAppSessionHeatmapRepository,
	WarehouseFacilityRepository,
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

function buildFacilityRepository() {
	const warehouseUrl = getServerEnv().DATA_WAREHOUSE_URL;
	if (!warehouseUrl) return new SampleFacilityRepository();
	return new CachedFacilityRepository(
		new WarehouseFacilityRepository(getWarehousePool(warehouseUrl)),
		new SystemClock(),
	);
}

function buildFacilities() {
	return {
		listFacilities: makeListFacilities({ facilities: buildFacilityRepository() }),
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
};

export function getContainer() {
	return container;
}
