import { GAME_DEPARTMENTS } from "@market-health-map/core/domain";
import { z } from "zod";
import { JsonPreference } from "@/infrastructure/cache/local-storage/json-preference/json-preference";

export const MAP_FILTERS_KEY = "market-health-map:map-filters";

const choiceSchema = z.union([z.string(), z.array(z.string())]).optional();

export const mapFiltersSchema = z.object({
	showActiveFacilities: z.boolean(),
	showInactiveFacilities: z.boolean(),
	showGamesTrend: z.boolean(),
	showSessions: z.boolean(),
	demandMetric: z.enum(["sessions", "registrations"]),
	supplyMetric: z.enum(["facilities", "games"]),
	gameDepartments: z.array(z.enum(GAME_DEPARTMENTS)),
	demandFiltersPresent: z.boolean(),
	supplyFiltersPresent: z.boolean(),
	sessionFilters: z.object({
		metric: z.literal("registrations").optional(),
		gender: choiceSchema,
		skill: choiceSchema,
		ageMin: z.number().int().min(0).max(120).optional(),
		ageMax: z.number().int().min(0).max(120).optional(),
	}),
});

export const mapFiltersPreference = new JsonPreference(MAP_FILTERS_KEY, mapFiltersSchema);
