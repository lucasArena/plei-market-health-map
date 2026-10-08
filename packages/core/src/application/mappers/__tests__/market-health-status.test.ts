import { toGamesTrend, toMarketHealthStatus } from "@core/application/mappers/market-health-status";

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

describe("toGamesTrend", () => {
	it("calls a drop of 5% or more declining and a rise of 5% or more growing", () => {
		expect(toGamesTrend(95, 100)).toBe("declining");
		expect(toGamesTrend(105, 100)).toBe("growing");
	});

	it("treats changes under 5% either way as stable", () => {
		expect(toGamesTrend(1162, 1169)).toBe("stable");
		expect(toGamesTrend(102, 100)).toBe("stable");
	});

	it("reads a first period with games as growing and two empty periods as stable", () => {
		expect(toGamesTrend(3, 0)).toBe("growing");
		expect(toGamesTrend(0, 0)).toBe("stable");
	});
});
