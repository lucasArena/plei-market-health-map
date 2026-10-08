import type { StatsPeriod } from "@market-health-map/core/application";
import type { ReactNode } from "react";

export type MapScope =
	| { kind: "all" }
	| { kind: "market"; id: string; name: string }
	| { kind: "facility"; id: string; name: string; marketName: string };

export interface MapScopeContextValue {
	scope: MapScope;
	mapNavigation: MapScope | null;
	setMapNavigation(scope: MapScope | null): void;
	selectedFacilityId: string | null;
	setSelectedFacilityId(id: string | null): void;
	setScope(scope: MapScope): void;
	period: StatsPeriod;
	setPeriod(period: StatsPeriod): void;
}

export interface MapScopeProviderProps {
	children: ReactNode;
}
