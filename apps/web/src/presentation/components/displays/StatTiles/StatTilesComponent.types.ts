import type { FacilityStatTile } from "@/presentation/components/map/FacilityDetailPanel/FacilityDetailPanelComponent.types";

export interface StatTilesProps {
	tiles: FacilityStatTile[];
	testIdPrefix: string;
}
