import {
	GAME_DEPARTMENTS,
	normalizeGameDepartments,
	sumGameDepartments,
} from "@core/domain/entities/game-department/game-department";

describe("normalizeGameDepartments", () => {
	it("keeps known departments once, in the map's order", () => {
		expect(normalizeGameDepartments(["partnerships", "magic", "magic"])).toEqual([
			"magic",
			"partnerships",
		]);
	});

	it("treats no filter and every department as all games", () => {
		expect(normalizeGameDepartments(undefined)).toEqual([]);
		expect(normalizeGameDepartments([])).toEqual([]);
		expect(normalizeGameDepartments([...GAME_DEPARTMENTS].reverse())).toEqual([]);
	});
});

describe("sumGameDepartments", () => {
	it("adds the selected departments and counts a missing breakdown as zero", () => {
		const counts = { magic: 3, organizers: 5, partnerships: 7 };

		expect(sumGameDepartments(counts, ["magic", "partnerships"])).toBe(10);
		expect(sumGameDepartments(undefined, ["magic"])).toBe(0);
		expect(sumGameDepartments(counts, [])).toBe(0);
	});
});
