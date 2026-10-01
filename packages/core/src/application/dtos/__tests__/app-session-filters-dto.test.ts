import { appSessionFiltersSchema } from "@core/application/dtos/app-session-filters-dto";

it("parses age boundaries and trims stored-profile filters", () => {
	expect(
		appSessionFiltersSchema.parse({
			gender: " Female ",
			skill: " Advanced ",
			ageMin: "0",
			ageMax: "17",
		}),
	).toEqual({ gender: "Female", skill: "Advanced", ageMin: 0, ageMax: 17 });
	expect(appSessionFiltersSchema.parse({})).toEqual({});
	expect(appSessionFiltersSchema.parse({ ageMax: 120 })).toEqual({ ageMax: 120 });
	expect(appSessionFiltersSchema.parse({ ageMin: 45 })).toEqual({ ageMin: 45 });
});
it.each([
	{ ageMin: 40, ageMax: 18 },
	{ ageMin: -1 },
	{ ageMax: 121 },
	{ ageMin: 1.5 },
	{ gender: " " },
	{ skill: "x".repeat(101) },
	{ unknown: true },
])("rejects invalid input %o", (filters) => {
	expect(appSessionFiltersSchema.safeParse(filters).success).toBe(false);
});
