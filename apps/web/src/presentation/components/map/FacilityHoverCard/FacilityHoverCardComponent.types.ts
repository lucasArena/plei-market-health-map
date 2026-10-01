import type { FacilityPointView } from "@market-health-map/core/application";
import type { Messages } from "@market-health-map/core/i18n";
import type { MapHover } from "@/presentation/screens/FacilitiesMapScreen/FacilitiesMapScreenComponent.types";

export interface FacilityHoverCardProps {
	hover: MapHover | null;
	messages: Messages["map"];
	onFacilitySelect?: (facility: FacilityPointView) => void;
	onClusterPointerEnter?: () => void;
	onClusterPointerLeave?: () => void;
}

export type ClusterHoverSide = "top" | "bottom" | "right" | "left";

export interface ClusterHoverCardSize {
	width: number;
	height: number;
}

export interface ClusterHoverChrome {
	top: number;
	right: number;
	bottom: number;
	left: number;
}

export interface ClusterHoverCardPlacementInput {
	cluster: { x: number; y: number };
	card: ClusterHoverCardSize;
	viewport: { width: number; height: number };
	chrome: ClusterHoverChrome;
	gap: number;
	clusterDiameter: number;
}

export interface ClusterHoverCardPlacement {
	side: ClusterHoverSide;
	left: number;
	top: number;
	transform: string;
}
