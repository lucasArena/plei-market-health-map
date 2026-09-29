import type { ServerContainer } from "@server/container.types";
import type { ResolveAccess } from "@server/presentation/http/authenticate.types";

export type ApiServices = Pick<
	ServerContainer,
	"listFacilities" | "getFacilityDetail" | "listAppSessionHeatmap" | "listRecentLogins"
>;

export interface CreateApiAppOptions {
	resolveAccess: ResolveAccess;
	services?: () => ApiServices;
}
