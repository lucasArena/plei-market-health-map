import { toGamesTrend } from "@core/application/mappers/games-trend";

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
