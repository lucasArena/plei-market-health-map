import type { MapScope } from "@/presentation/components/providers/MapScopeProvider/MapScopeProviderComponent.types";

export type InsightPanelSkeletonLevel = MapScope["kind"];

export interface InsightPanelSkeletonProps {
	level: InsightPanelSkeletonLevel;
}

export interface ChartModuleSkeletonProps {
	testId: string;
	rows: number;
}

export interface ListModuleSkeletonProps {
	testId: string;
}
