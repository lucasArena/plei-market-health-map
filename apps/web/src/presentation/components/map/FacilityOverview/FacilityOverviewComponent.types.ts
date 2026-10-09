import type { Messages } from "@market-health-map/core/i18n";

export type FacilityViewMessages = Messages["facilityView"];

export interface FacilityOverviewProps {
	facilityId: string;
	facilityName: string;
	marketName: string;
}
