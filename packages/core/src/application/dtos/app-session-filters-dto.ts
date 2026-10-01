import { z } from "zod";

const profileValue = z.string().trim().min(1).max(100).optional();
const age = z
	.union([z.number(), z.string().regex(/^\d+$/)])
	.transform(Number)
	.pipe(z.number().int().min(0).max(120))
	.optional();

export const appSessionFiltersSchema = z
	.object({
		gender: profileValue,
		skill: profileValue,
		ageMin: age,
		ageMax: age,
	})
	.strict()
	.refine(
		(filters) =>
			filters.ageMin === undefined ||
			filters.ageMax === undefined ||
			filters.ageMin <= filters.ageMax,
		{ path: ["ageMax"], message: "Invalid age range" },
	);
