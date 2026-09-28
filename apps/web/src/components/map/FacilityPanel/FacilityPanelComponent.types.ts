import type { FacilityPointView } from "@market-health-map/application";

export interface FacilityPanelProps {
	facility: FacilityPointView;
	onClose: () => void;
}
