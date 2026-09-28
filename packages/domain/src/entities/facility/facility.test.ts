import { Facility } from "@domain/entities/facility/facility";
import { ValidationError } from "@domain/shared/domain-error";
import { asEntityId } from "@domain/shared/id";

const VALID = {
	id: asEntityId("facility-1"),
	marketId: asEntityId("market-1"),
	name: " Eastside Futsal ",
	address: " 12 Main St ",
	location: { latitude: 30.27, longitude: -97.74 },
	avatarUrl: " https://cdn.plei.app/f1.png ",
	metrics: { activePlayers: 120, gamesLastWeek: 30, utilization: 72 },
};

describe("Facility", () => {
	it("creates a normalized facility", () => {
		const facility = Facility.create(VALID);

		expect(facility.id).toBe(VALID.id);
		expect(facility.marketId).toBe(VALID.marketId);
		expect(facility.toJSON()).toMatchObject({
			name: "Eastside Futsal",
			address: "12 Main St",
			avatarUrl: "https://cdn.plei.app/f1.png",
		});
	});

	it("treats a missing or blank avatar as null", () => {
		expect(Facility.create({ ...VALID, avatarUrl: null }).toJSON().avatarUrl).toBeNull();
		expect(Facility.create({ ...VALID, avatarUrl: "  " }).toJSON().avatarUrl).toBeNull();
	});

	it("rejects an invalid location", () => {
		expect(() => Facility.create({ ...VALID, location: { latitude: 91, longitude: 0 } })).toThrow(
			"Facility location must be a valid coordinate.",
		);
	});

	it("rejects invalid counts", () => {
		expect(() =>
			Facility.create({ ...VALID, metrics: { ...VALID.metrics, gamesLastWeek: -1 } }),
		).toThrow(ValidationError);
	});

	it("rejects utilization out of range", () => {
		expect(() =>
			Facility.create({ ...VALID, metrics: { ...VALID.metrics, utilization: 101 } }),
		).toThrow("between 0 and 100");
		expect(() =>
			Facility.create({ ...VALID, metrics: { ...VALID.metrics, utilization: -1 } }),
		).toThrow(ValidationError);
	});

	it("restores and copies props defensively", () => {
		const facility = Facility.restore(VALID);
		const json = facility.toJSON();
		json.metrics.utilization = 0;
		json.location.latitude = 0;
		expect(facility.toJSON()).toEqual(VALID);
	});
});
