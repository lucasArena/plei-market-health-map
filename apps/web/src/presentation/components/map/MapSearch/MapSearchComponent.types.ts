import type { FacilityPointView } from "@market-health-map/core/application";
import type { Messages } from "@market-health-map/core/i18n";

export interface MarketSearchResult {
	id: string;
	name: string;
	facilities: FacilityPointView[];
}

export interface MapSearchProps {
	facilities: FacilityPointView[];
	messages: Messages["map"];
	onFacilitySelect(facility: FacilityPointView): void;
	onMarketSelect(market: MarketSearchResult): void;
	onClear(): void;
}
