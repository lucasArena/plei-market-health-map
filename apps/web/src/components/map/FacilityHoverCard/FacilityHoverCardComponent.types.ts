import type { Messages } from "@market-health-map/i18n";
import type { MapHover } from "@/components/map/FacilitiesMap/FacilitiesMapComponent.types";

export interface FacilityHoverCardProps {
	hover: MapHover;
	messages: Messages["map"];
}
