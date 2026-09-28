import type {
	GetMarketDetailInput,
	ListRecentLoginsInput,
	RecordLoginInput,
} from "@market-health-map/application";
import {
	makeGetMarketDetail,
	makeListMarketHealth,
	makeListRecentLogins,
	makeRecordLogin,
} from "@market-health-map/application";
import {
	getPrismaClient,
	PrismaLoginEventRepository,
	SampleFacilityRepository,
	SampleMarketRepository,
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

function buildMarkets() {
	const markets = new SampleMarketRepository();
	const facilities = new SampleFacilityRepository();
	return {
		listMarketHealth: makeListMarketHealth({ markets }),
		getMarketDetail: makeGetMarketDetail({ markets, facilities }),
	};
}

let logins: ReturnType<typeof buildLogins> | undefined;
let markets: ReturnType<typeof buildMarkets> | undefined;

function loginModule() {
	logins ??= buildLogins();
	return logins;
}

function marketModule() {
	markets ??= buildMarkets();
	return markets;
}

const container = {
	recordLogin: (input: RecordLoginInput) => loginModule().recordLogin(input),
	listRecentLogins: (input?: ListRecentLoginsInput) => loginModule().listRecentLogins(input),
	listMarketHealth: () => marketModule().listMarketHealth(),
	getMarketDetail: (input: GetMarketDetailInput) => marketModule().getMarketDetail(input),
};

export function getContainer() {
	return container;
}
