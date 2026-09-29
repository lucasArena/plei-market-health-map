import { z } from "zod";

export const getFacilityDetailSchema = z.object({
	facilityId: z.string().trim().min(1),
});
