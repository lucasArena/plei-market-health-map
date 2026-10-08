"use client";

import { type GameDepartment, normalizeGameDepartments } from "@market-health-map/core/domain";
import { useMemo } from "react";
import { useMapLayers } from "@/presentation/components/map/MapLayersPanel/MapLayersPanelComponent.context";
import { useFeatureFlag } from "@/presentation/hooks/use-feature-flags/use-feature-flags";

export function useMarketSummaryFilters(): { departments: GameDepartment[] } {
	const showSupplyFilters = useFeatureFlag("facility-games-layer");
	const gameDepartments = useMapLayers()?.gameDepartments;
	return useMemo(
		() => ({
			departments: showSupplyFilters ? normalizeGameDepartments(gameDepartments) : [],
		}),
		[showSupplyFilters, gameDepartments],
	);
}
