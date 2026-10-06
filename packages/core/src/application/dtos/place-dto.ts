import { z } from "zod";

export const PLACE_RESULT_LIMIT = 5;
export const MIN_PLACE_QUERY_LENGTH = 2;

export const searchPlacesSchema = z.object({
	query: z.string().trim().min(MIN_PLACE_QUERY_LENGTH).max(100),
});
