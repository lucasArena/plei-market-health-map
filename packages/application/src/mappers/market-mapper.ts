import type { MarketHealthView } from "@application/dtos/market-dto.types";
import type { Market } from "@market-health-map/domain";

export function toMarketHealthView(market: Market): MarketHealthView {
	const props = market.toJSON();
	return {
		id: props.id,
		name: props.name,
		state: props.state,
		country: props.country,
		currency: props.currency,
		location: props.location,
		metrics: props.metrics,
		healthStatus: market.healthStatus,
	};
}
