import type { Messages } from "@market-health-map/core/i18n";
import type { MapHover } from "@/presentation/screens/FacilitiesMapScreen/FacilitiesMapScreenComponent.types";

export interface FacilityHoverCardProps {
	hover: MapHover;
	messages: Messages["map"];
}
