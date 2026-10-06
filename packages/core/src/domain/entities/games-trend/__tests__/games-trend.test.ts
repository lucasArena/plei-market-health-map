import {
	classifyGamesTrend,
	GAMES_WINDOW_DAYS,
	gamesTrend,
} from "@core/domain/entities/games-trend/games-trend";

describe("classifyGamesTrend", () => {
	it.each([
		[42, 41, "up"],
		[41, 42, "down"],
		[1800, 1930, "down"],
		[1, 0, "up"],
		[0, 1, "down"],
		[42, 42, "stable"],
		[0, 0, "stable"],
	] as const)("classifies %s current versus %s previous as %s", (current, previous, level) => {
		expect(classifyGamesTrend(current, previous)).toBe(level);
	});
	it("normalizes invalid counts and compares complete 28-day windows", () => {
		expect(classifyGamesTrend(Number.NaN, -3)).toBe("stable");
		expect(classifyGamesTrend(Number.POSITIVE_INFINITY, 10)).toBe("down");
		expect(GAMES_WINDOW_DAYS).toBe(28);
	});
});

describe("gamesTrend", () => {
	it("returns the change and the rounded percent", () => {
		expect(gamesTrend(42, 51)).toEqual({
			level: "down",
			current: 42,
			previous: 51,
			change: -9,
			percentChange: -18,
		});
	});

	it("classifies summed cluster windows, not averaged percents", () => {
		expect(gamesTrend(12 + 51, 10 + 50).level).toBe("up");
		expect(gamesTrend(22 + 22, 20 + 20).level).toBe("up");
		expect(classifyGamesTrend(22, 20)).toBe("up");
	});

	it("has no percent when the previous window was 0", () => {
		expect(gamesTrend(6, 0)).toEqual({
			level: "up",
			current: 6,
			previous: 0,
			change: 6,
			percentChange: null,
		});
	});
});
