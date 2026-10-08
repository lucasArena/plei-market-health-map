import type { ServerContainer } from "@server/container.types";
import type {
	AuthenticatedPrincipal,
	ResolveAccess,
} from "@server/presentation/http/authenticate.types";

export type ApiServices = Pick<
	ServerContainer,
	| "listFacilities"
	| "getFacilityDetail"
	| "getFacilityReservationStats"
	| "getFacilityPlayerStats"
	| "getMarketSummary"
	| "getMarketGameInsights"
	| "getMarketPlayerStats"
	| "getMetricDrillDown"
	| "listAppSessionHeatmap"
	| "listAppSessionFilterOptions"
	| "listRecentLogins"
	| "submitFeedback"
	| "recordDailyActivity"
	| "getAppMetrics"
	| "listAppMetricsPeople"
	| "listEnabledFeatureFlags"
	| "listFeatureFlags"
	| "setFeatureFlag"
	| "searchPlaces"
>;

export type ApiEnv = {
	Variables: { principal: AuthenticatedPrincipal };
};

export interface CreateApiAppOptions {
	resolveAccess: ResolveAccess;
	services?: () => ApiServices;
}
