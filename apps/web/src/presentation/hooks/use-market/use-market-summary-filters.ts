"use client";

import { type GameDepartment, normalizeGameDepartments } from "@market-health-map/core/domain";
import { useMemo } from "react";
import { useMapLayers } from "@/presentation/components/map/MapLayersPanel/MapLayersPanelComponent.context";

export function useMarketSummaryFilters(): { departments: GameDepartment[] } {
	const gameDepartments = useMapLayers()?.gameDepartments;
	return useMemo(
		() => ({ departments: normalizeGameDepartments(gameDepartments) }),
		[gameDepartments],
	);
}
