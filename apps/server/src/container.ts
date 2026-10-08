import type {
	GetFacilityDetailInput,
	GetFacilityPlayerStatsInput,
	GetFacilityReservationStatsInput,
	GetMarketAudienceInput,
	GetMarketGameInsightsInput,
	GetMarketPlayerStatsInput,
	GetMarketSummaryInput,
	IssueTracker,
	ListAppMetricsPeopleInput,
	ListRecentLoginsInput,
	RecordDailyActivityInput,
	RecordLoginInput,
	SearchPlacesInput,
	SetFeatureFlagInput,
	StatsPeriod,
	SubmitFeedbackInput,
} from "@market-health-map/core/application";
import {
	type AppSessionFilters,
	FEATURE_FLAG_KEYS,
	makeGetAppMetrics,
	makeGetFacilityDetail,
	makeGetFacilityPlayerStats,
	makeGetFacilityReservationStats,
	makeGetMarketAudience,
	makeGetMarketGameInsights,
	makeGetMarketPlayerStats,
	makeGetMarketSummary,
	makeListAppMetricsPeople,
	makeListAppSessionFilterOptions,
	makeListAppSessionHeatmap,
	makeListEnabledFeatureFlags,
	makeListFacilities,
	makeListFeatureFlags,
	makeListRecentLogins,
	makeRecordDailyActivity,
	makeRecordLogin,
	makeSearchPlaces,
	makeSetFeatureFlag,
	makeSubmitFeedback,
} from "@market-health-map/core/application";
import {
	getFeedbackMode,
	getLinearCredentials,
	getServerEnv,
	getTargetUserEmails,
	hasPartialLinearAppCredentials,
} from "@server/env";
import { DryRunIssueTracker } from "@server/infrastructure/providers/linear/dry-run-issue-tracker/dry-run-issue-tracker";
import {
	LinearApiKeyAuth,
	LinearAppAuth,
} from "@server/infrastructure/providers/linear/linear-auth/linear-auth";
import { LinearIssueTracker } from "@server/infrastructure/providers/linear/linear-issue-tracker/linear-issue-tracker";
import { CachedPlaceSearch } from "@server/infrastructure/providers/photon/cached-place-search/cached-place-search";
import { PhotonPlaceSearch } from "@server/infrastructure/providers/photon/photon-place-search/photon-place-search";
import { SystemClock } from "@server/infrastructure/providers/system/system-clock/system-clock";
import { UuidGenerator } from "@server/infrastructure/providers/system/uuid-generator/uuid-generator";
import { CachedDailyActivityRepository } from "@server/infrastructure/repositories/database/cached-daily-activity-repository/cached-daily-activity-repository";
import { CachedFeatureFlagRepository } from "@server/infrastructure/repositories/database/cached-feature-flag-repository/cached-feature-flag-repository";
import { getPrismaClient } from "@server/infrastructure/repositories/database/prisma-client/prisma-client";
import { PrismaDailyActivityRepository } from "@server/infrastructure/repositories/database/prisma-daily-activity-repository/prisma-daily-activity-repository";
import { PrismaFeatureFlagRepository } from "@server/infrastructure/repositories/database/prisma-feature-flag-repository/prisma-feature-flag-repository";
import { PrismaLoginEventRepository } from "@server/infrastructure/repositories/database/prisma-login-event-repository/prisma-login-event-repository";
import { FixtureAppSessionHeatmapRepository } from "@server/infrastructure/repositories/sample/fixture-app-session-heatmap-repository/fixture-app-session-heatmap-repository";
import { MemoryDailyActivityRepository } from "@server/infrastructure/repositories/sample/memory-daily-activity-repository/memory-daily-activity-repository";
import { MemoryFeatureFlagRepository } from "@server/infrastructure/repositories/sample/memory-feature-flag-repository/memory-feature-flag-repository";
import { SampleFacilityRepository } from "@server/infrastructure/repositories/sample/sample-facility-repository/sample-facility-repository";
import { SampleFacilityStatsRepository } from "@server/infrastructure/repositories/sample/sample-facility-stats-repository/sample-facility-stats-repository";
import { SampleMarketAudienceRepository } from "@server/infrastructure/repositories/sample/sample-market-audience-repository/sample-market-audience-repository";
import { CachedAppSessionHeatmapRepository } from "@server/infrastructure/repositories/warehouse/cached-app-session-heatmap-repository/cached-app-session-heatmap-repository";
import { CachedFacilityRepository } from "@server/infrastructure/repositories/warehouse/cached-facility-repository/cached-facility-repository";
import { CachedFacilityStatsRepository } from "@server/infrastructure/repositories/warehouse/cached-facility-stats-repository/cached-facility-stats-repository";
import { CachedMarketAudienceRepository } from "@server/infrastructure/repositories/warehouse/cached-market-audience-repository/cached-market-audience-repository";
import { WarehouseAppSessionHeatmapRepository } from "@server/infrastructure/repositories/warehouse/warehouse-app-session-heatmap-repository/warehouse-app-session-heatmap-repository";
import { WarehouseFacilityRepository } from "@server/infrastructure/repositories/warehouse/warehouse-facility-repository/warehouse-facility-repository";
import { WarehouseFacilityStatsRepository } from "@server/infrastructure/repositories/warehouse/warehouse-facility-stats-repository/warehouse-facility-stats-repository";
import { WarehouseMarketAudienceRepository } from "@server/infrastructure/repositories/warehouse/warehouse-market-audience-repository/warehouse-market-audience-repository";
import { getWarehousePool } from "@server/infrastructure/repositories/warehouse/warehouse-pool/warehouse-pool";

function buildDailyActivityRepository() {
	const databaseUrl = getServerEnv().DATABASE_URL;
	const clock = new SystemClock();
	if (!databaseUrl) return new MemoryDailyActivityRepository();
	return new CachedDailyActivityRepository(
		new PrismaDailyActivityRepository(getPrismaClient(databaseUrl)),
		clock,
	);
}

function buildFeatureFlags() {
	const databaseUrl = getServerEnv().DATABASE_URL;
	const clock = new SystemClock();
	const featureFlags = databaseUrl
		? new CachedFeatureFlagRepository(
				new PrismaFeatureFlagRepository(getPrismaClient(databaseUrl)),
				clock,
			)
		: new MemoryFeatureFlagRepository(
				FEATURE_FLAG_KEYS.map((key) => ({
					key,
					enabled: true,
					updatedBy: "local",
					updatedAt: new Date(0),
				})),
			);
	return {
		listEnabledFeatureFlags: makeListEnabledFeatureFlags({ featureFlags }),
		listFeatureFlags: makeListFeatureFlags({ featureFlags }),
		setFeatureFlag: makeSetFeatureFlag({ featureFlags, clock }),
	};
}

function buildAppMetrics() {
	const dailyActivity = buildDailyActivityRepository();
	const clock = new SystemClock();
	const targetEmails = getTargetUserEmails();
	return {
		recordDailyActivity: makeRecordDailyActivity({ dailyActivity, clock }),
		getAppMetrics: makeGetAppMetrics({ dailyActivity, clock, targetEmails }),
		listAppMetricsPeople: makeListAppMetricsPeople({ dailyActivity, clock, targetEmails }),
	};
}

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
			audience: new SampleMarketAudienceRepository(),
		};
	}
	const pool = getWarehousePool(warehouseUrl);
	return {
		facilities: new CachedFacilityRepository(new WarehouseFacilityRepository(pool), clock),
		stats: new CachedFacilityStatsRepository(new WarehouseFacilityStatsRepository(pool), clock),
		audience: new CachedMarketAudienceRepository(
			new WarehouseMarketAudienceRepository(pool),
			clock,
		),
	};
}

function enabledFeatureFlags() {
	if (process.env.NODE_ENV === "development") {
		return Promise.resolve({ enabled: [...FEATURE_FLAG_KEYS] });
	}
	return featureFlagModule().listEnabledFeatureFlags();
}

function buildFacilities() {
	const repositories = { ...buildFacilityRepositories(), clock: new SystemClock() };
	return {
		listFacilities: makeListFacilities({
			facilities: repositories.facilities,
			enabledFeatureFlags,
			clock: repositories.clock,
		}),
		getFacilityDetail: makeGetFacilityDetail(repositories),
		getFacilityReservationStats: makeGetFacilityReservationStats(repositories),
		getFacilityPlayerStats: makeGetFacilityPlayerStats(repositories),
		getMarketSummary: makeGetMarketSummary(repositories),
		getMarketGameInsights: makeGetMarketGameInsights(repositories),
		getMarketPlayerStats: makeGetMarketPlayerStats(repositories),
		getMarketAudience: makeGetMarketAudience(repositories),
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
	const appSessionHeatmap = buildAppSessionHeatmapRepository();
	const listAppSessionHeatmap = makeListAppSessionHeatmap({
		appSessionHeatmap,
		enabledFeatureFlags,
		clock: new SystemClock(),
	});
	const listAppSessionFilterOptions = makeListAppSessionFilterOptions({
		appSessionHeatmap,
		enabledFeatureFlags,
	});
	return {
		listAppSessionFilterOptions,
		listAppSessionHeatmap: async (
			filters: AppSessionFilters = {},
			period?: StatsPeriod,
			timeZone?: string,
		) => {
			try {
				return await listAppSessionHeatmap(filters, period, timeZone);
			} catch (error) {
				console.error(
					"[app-session-heatmap]",
					error instanceof Error ? error.stack : String(error),
				);
				throw error;
			}
		},
	};
}

function buildPlaces() {
	return {
		searchPlaces: makeSearchPlaces({
			places: new CachedPlaceSearch(new PhotonPlaceSearch(), new SystemClock()),
		}),
	};
}

function buildIssueTracker(): IssueTracker | null {
	if (getFeedbackMode() === "dry-run") {
		console.warn("[feedback] FEEDBACK_DRY_RUN is on: feedback is logged, not sent to Linear.");
		return new DryRunIssueTracker();
	}
	if (hasPartialLinearAppCredentials()) {
		console.warn(
			"[feedback] Set both LINEAR_CLIENT_ID and LINEAR_CLIENT_SECRET to file issues as the Linear app.",
		);
	}
	const credentials = getLinearCredentials();
	if (!credentials) return null;
	const auth =
		credentials.kind === "app"
			? new LinearAppAuth({
					clientId: credentials.clientId,
					clientSecret: credentials.clientSecret,
				})
			: new LinearApiKeyAuth(credentials.apiKey);
	return new LinearIssueTracker({ auth });
}

function buildFeedback() {
	return {
		submitFeedback: makeSubmitFeedback({ issues: buildIssueTracker(), clock: new SystemClock() }),
	};
}

let logins: ReturnType<typeof buildLogins> | undefined;
let facilities: ReturnType<typeof buildFacilities> | undefined;
let appSessionHeatmap: ReturnType<typeof buildAppSessionHeatmap> | undefined;
let feedback: ReturnType<typeof buildFeedback> | undefined;
let places: ReturnType<typeof buildPlaces> | undefined;
let appMetrics: ReturnType<typeof buildAppMetrics> | undefined;
let featureFlags: ReturnType<typeof buildFeatureFlags> | undefined;

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

function appMetricsModule() {
	appMetrics ??= buildAppMetrics();
	return appMetrics;
}

function featureFlagModule() {
	featureFlags ??= buildFeatureFlags();
	return featureFlags;
}

function placeModule() {
	places ??= buildPlaces();
	return places;
}

function feedbackModule() {
	feedback ??= buildFeedback();
	return feedback;
}

const container = {
	recordLogin: (input: RecordLoginInput) => loginModule().recordLogin(input),
	listRecentLogins: (input?: ListRecentLoginsInput) => loginModule().listRecentLogins(input),
	listFacilities: (input?: { timeZone?: string }) => facilityModule().listFacilities(input),
	listAppSessionHeatmap: (filters?: AppSessionFilters, period?: StatsPeriod, timeZone?: string) =>
		appSessionHeatmapModule().listAppSessionHeatmap(filters, period, timeZone),
	listAppSessionFilterOptions: () => appSessionHeatmapModule().listAppSessionFilterOptions(),
	getFacilityDetail: (input: GetFacilityDetailInput) => facilityModule().getFacilityDetail(input),
	getFacilityReservationStats: (input: GetFacilityReservationStatsInput) =>
		facilityModule().getFacilityReservationStats(input),
	getFacilityPlayerStats: (input: GetFacilityPlayerStatsInput) =>
		facilityModule().getFacilityPlayerStats(input),
	getMarketGameInsights: (input?: GetMarketGameInsightsInput) =>
		facilityModule().getMarketGameInsights(input),
	getMarketSummary: (input?: GetMarketSummaryInput) => facilityModule().getMarketSummary(input),
	getMarketPlayerStats: (input?: GetMarketPlayerStatsInput) =>
		facilityModule().getMarketPlayerStats(input),
	getMarketAudience: (input?: GetMarketAudienceInput) => facilityModule().getMarketAudience(input),
	submitFeedback: (input: SubmitFeedbackInput) => feedbackModule().submitFeedback(input),
	recordDailyActivity: (input: RecordDailyActivityInput) =>
		appMetricsModule().recordDailyActivity(input),
	getAppMetrics: () => appMetricsModule().getAppMetrics(),
	listAppMetricsPeople: (input?: ListAppMetricsPeopleInput) =>
		appMetricsModule().listAppMetricsPeople(input),
	listEnabledFeatureFlags: () => featureFlagModule().listEnabledFeatureFlags(),
	listFeatureFlags: () => featureFlagModule().listFeatureFlags(),
	setFeatureFlag: (input: SetFeatureFlagInput) => featureFlagModule().setFeatureFlag(input),
	searchPlaces: (input: SearchPlacesInput) => placeModule().searchPlaces(input),
};

export function getContainer() {
	return container;
}
