import type { MarketProps } from "@market-health-map/core/domain";
import { asEntityId } from "@market-health-map/core/domain";
import { PLEI_REGIONS } from "@server/infrastructure/sample/plei-regions";
import type { PleiRegion } from "@server/infrastructure/sample/plei-regions.types";
import { createSeededRandom } from "@server/infrastructure/sample/seeded-random";

function between(random: () => number, min: number, max: number): number {
	return Math.round(min + random() * (max - min));
}

export function toSampleMarket(region: PleiRegion): MarketProps {
	const random = createSeededRandom(region.slug);
	const { facilities } = region;
	return {
		id: asEntityId(region.slug),
		name: region.name,
		state: region.state,
		country: region.country,
		currency: region.currency,
		location: { latitude: region.latitude, longitude: region.longitude },
		metrics: {
			facilities,
			activePlayers: facilities * between(random, 35, 70),
			gamesLastWeek: facilities * between(random, 4, 9),
			healthScore: facilities > 0 ? between(random, 22, 95) : 0,
		},
	};
}

export const SAMPLE_MARKETS: MarketProps[] = PLEI_REGIONS.map(toSampleMarket);
