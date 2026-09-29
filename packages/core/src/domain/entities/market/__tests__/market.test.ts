import { Market } from "@core/domain/entities/market/market";
import { ValidationError } from "@core/domain/shared/domain-error";
import { asEntityId } from "@core/domain/shared/id";

const VALID = {
	id: asEntityId("market-1"),
	name: " Austin ",
	state: " Texas ",
	country: " usa ",
	currency: "USD",
	location: { latitude: 30.27, longitude: -97.74 },
	metrics: { activePlayers: 1200, gamesLastWeek: 340, facilities: 18, healthScore: 82 },
};

function withScore(healthScore: number) {
	return Market.create({ ...VALID, metrics: { ...VALID.metrics, healthScore } });
}

describe("Market", () => {
	it("creates a normalized market", () => {
		const market = Market.create(VALID);

		expect(market.id).toBe(VALID.id);
		expect(market.toJSON()).toMatchObject({
			name: "Austin",
			state: "Texas",
			country: "USA",
			currency: "USD",
		});
	});

	it("derives the health status from the score", () => {
		expect(withScore(70).healthStatus).toBe("healthy");
		expect(withScore(69.9).healthStatus).toBe("watch");
		expect(withScore(40).healthStatus).toBe("watch");
		expect(withScore(39).healthStatus).toBe("at-risk");
	});

	it("is inactive when it has no facilities, whatever the score", () => {
		const market = Market.create({ ...VALID, metrics: { ...VALID.metrics, facilities: 0 } });
		expect(market.healthStatus).toBe("inactive");
	});

	it.each([
		{ latitude: 91, longitude: 0 },
		{ latitude: 0, longitude: -181 },
	])("rejects an invalid location %o", (location) => {
		expect(() => Market.create({ ...VALID, location })).toThrow(ValidationError);
	});

	it("rejects negative or fractional counts", () => {
		expect(() =>
			Market.create({ ...VALID, metrics: { ...VALID.metrics, facilities: -1 } }),
		).toThrow("non-negative integers");
		expect(() =>
			Market.create({ ...VALID, metrics: { ...VALID.metrics, activePlayers: 1.5 } }),
		).toThrow(ValidationError);
	});

	it("rejects country and currency codes that are not 3 letters", () => {
		expect(() => Market.create({ ...VALID, country: "US" })).toThrow("Market country must be");
		expect(() => Market.create({ ...VALID, currency: "US$" })).toThrow("Market currency must be");
	});

	it("rejects a health score out of range", () => {
		expect(() => withScore(101)).toThrow("between 0 and 100");
		expect(() => withScore(-1)).toThrow(ValidationError);
	});

	it("restores and copies props defensively", () => {
		const market = Market.restore({ ...VALID, state: "TX", country: "USA" });
		const json = market.toJSON();
		json.metrics.healthScore = 0;
		json.location.latitude = 0;

		expect(market.toJSON()).toEqual({ ...VALID, state: "TX", country: "USA" });
	});
});
