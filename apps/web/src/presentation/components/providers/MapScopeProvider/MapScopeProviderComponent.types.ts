import type { StatsPeriod } from "@market-health-map/core/application";
import type { GameDepartment } from "@market-health-map/core/domain";
import type { ReactNode } from "react";

export type MapScope =
	| { kind: "all" }
	| { kind: "market"; id: string; name: string }
	| { kind: "facility"; id: string; name: string; marketName: string };

export type MapNavigation = MapScope | { kind: "metric-focus"; facilityIds: readonly string[] };

export interface MetricMapFocus {
	facilityIds: readonly string[];
	department?: GameDepartment;
}

export interface MapScopeContextValue {
	metricFocus: MetricMapFocus | null;
	setMetricFocus(focus: MetricMapFocus | null): void;
	scope: MapScope;
	mapNavigation: MapNavigation | null;
	setMapNavigation(scope: MapNavigation | null): void;
	selectedFacilityId: string | null;
	setSelectedFacilityId(id: string | null): void;
	setScope(scope: MapScope): void;
	period: StatsPeriod;
	setPeriod(period: StatsPeriod): void;
}

export interface MapScopeProviderProps {
	children: ReactNode;
}
