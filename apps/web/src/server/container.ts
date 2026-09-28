import type { ListRecentLoginsInput, RecordLoginInput } from "@market-health-map/application";
import {
	makeListFacilities,
	makeListRecentLogins,
	makeRecordLogin,
} from "@market-health-map/application";
import {
	getPrismaClient,
	PrismaLoginEventRepository,
	SampleFacilityRepository,
	SystemClock,
	UuidGenerator,
} from "@market-health-map/infrastructure";
import { getServerEnv } from "@/env";

function buildLogins() {
	const prisma = getPrismaClient(getServerEnv().DATABASE_URL);
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

function buildFacilities() {
	return {
		listFacilities: makeListFacilities({ facilities: new SampleFacilityRepository() }),
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
