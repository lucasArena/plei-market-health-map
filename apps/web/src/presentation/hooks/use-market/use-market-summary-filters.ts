"use client";

import { type GameDepartment, normalizeGameDepartments } from "@market-health-map/core/domain";
import { useMemo } from "react";
import { useMapLayers } from "@/presentation/components/map/MapLayersPanel/MapLayersPanelComponent.context";
import { useFeatureFlag } from "@/presentation/hooks/use-feature-flags/use-feature-flags";

/**
 * The Layers filters the summary panel follows, read the same way the map reads them: the
 * game department filter only counts while `facility-games-layer` is on. Normalized, so the
 * same choice always makes the same query key.
 */
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
