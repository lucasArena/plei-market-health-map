import { toMarketHealthStatus } from "@core/application/mappers/market-health-status";

describe("toMarketHealthStatus", () => {
	it("flags a drop of 20% or more for attention", () => {
		expect(toMarketHealthStatus(48, 60)).toBe("attention");
		expect(toMarketHealthStatus(0, 5)).toBe("attention");
	});

	it("asks to watch a drop between 10% and 20%", () => {
		expect(toMarketHealthStatus(15, 18)).toBe("watch");
		expect(toMarketHealthStatus(9, 10)).toBe("watch");
	});

	it("keeps small dips, growth and markets without a baseline on track", () => {
		expect(toMarketHealthStatus(97, 100)).toBe("on-track");
		expect(toMarketHealthStatus(21, 14)).toBe("on-track");
		expect(toMarketHealthStatus(4, 0)).toBe("on-track");
	});
});
