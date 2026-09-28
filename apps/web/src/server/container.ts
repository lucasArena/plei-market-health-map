import type { ListRecentLoginsInput, RecordLoginInput } from "@market-health-map/application";
import {
	makeListFacilities,
	makeListRecentLogins,
	makeRecordLogin,
} from "@market-health-map/application";
import {
	CachedFacilityRepository,
	getPrismaClient,
	getWarehousePool,
	PrismaLoginEventRepository,
	SampleFacilityRepository,
	SystemClock,
	UuidGenerator,
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

let logins: ReturnType<typeof buildLogins> | undefined;
let facilities: ReturnType<typeof buildFacilities> | undefined;

function loginModule() {
	logins ??= buildLogins();
	return logins;
}

function facilityModule() {
	facilities ??= buildFacilities();
	return facilities;
}

const container = {
	recordLogin: (input: RecordLoginInput) => loginModule().recordLogin(input),
	listRecentLogins: (input?: ListRecentLoginsInput) => loginModule().listRecentLogins(input),
	listFacilities: () => facilityModule().listFacilities(),
};

export function getContainer() {
	return container;
}
