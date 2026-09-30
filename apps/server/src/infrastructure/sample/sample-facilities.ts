import type { FacilityProps, GeoPoint, MarketProps } from "@market-health-map/core/domain";
import { asEntityId } from "@market-health-map/core/domain";
import { createSeededRandom, distribute } from "@server/infrastructure/sample/seeded-random";

const AREAS = [
	"Northside",
	"Downtown",
	"Riverside",
	"Eastside",
	"Westgate",
	"Lakeview",
	"Midtown",
	"Southpark",
	"Oak Hill",
	"Highland",
	"Parkside",
	"Harbor",
];

const KINDS = [
	"Sports Complex",
	"Futsal Arena",
	"Soccer Center",
	"Rec Center",
	"Athletic Club",
	"Field House",
	"Turf Park",
	"Sports Dome",
];

const STREETS = ["Main", "Oak", "Maple", "Cedar", "Elm", "Lake", "Park", "Hill", "Pine", "Sunset"];

function pick<T>(items: T[], random: () => number): T {
	return items[Math.floor(random() * items.length)] as T;
}

export function buildFacilityNames(count: number, random: () => number): string[] {
	const combos = AREAS.flatMap((area) => KINDS.map((kind) => `${area} ${kind}`));
	const shuffled = combos
		.map((name) => ({ name, order: random() }))
		.sort((a, b) => a.order - b.order)
		.map((item) => item.name);
	return Array.from({ length: count }, (_, index) => {
		const round = Math.floor(index / shuffled.length);
		const base = shuffled[index % shuffled.length] as string;
		return round === 0 ? base : `${base} ${round + 1}`;
	});
}

export const SPREAD_DEGREES = 0.3;

export function scatterAround(center: GeoPoint, random: () => number): GeoPoint {
	const distance = SPREAD_DEGREES * Math.sqrt(random());
	const angle = random() * 2 * Math.PI;
	const longitudeScale = Math.cos((center.latitude * Math.PI) / 180);
	return {
		latitude: center.latitude + distance * Math.sin(angle),
		longitude: center.longitude + (distance * Math.cos(angle)) / longitudeScale,
	};
}

export function buildSampleFacilities(market: MarketProps): FacilityProps[] {
	const random = createSeededRandom(market.id);
	const count = market.metrics.facilities;
	const weights = Array.from({ length: count }, () => 0.1 + random() ** 3);
	const games = distribute(market.metrics.gamesLastWeek, weights);
	const players = distribute(market.metrics.activePlayers, weights);
	const names = buildFacilityNames(count, random);

	return weights.map((_, index) => ({
		id: asEntityId(`${market.id}-facility-${index + 1}`),
		marketId: market.id,
		marketName: market.name,
		name: names[index] as string,
		address: `${100 + Math.floor(random() * 9800)} ${pick(STREETS, random)} St, ${market.name}, ${market.state}`,
		location: scatterAround(market.location, random),
		avatarUrl: null,
		metrics: {
			activePlayers: players[index] as number,
			gamesLastWeek: games[index] as number,
			gamesLast28Days: (games[index] as number) * 4,
			utilization: Math.round(35 + random() * 63),
		},
	}));
}
