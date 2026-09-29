import { z } from "zod";

export const DEFAULT_RECENT_LOGINS_LIMIT = 20;
export const MAX_RECENT_LOGINS_LIMIT = 100;

export const recordLoginSchema = z.object({
	userId: z.string().trim().min(1),
	sessionId: z.string().trim().min(1),
	email: z.email(),
});

export const listRecentLoginsSchema = z.object({
	limit: z.coerce
		.number()
		.int()
		.min(1)
		.max(MAX_RECENT_LOGINS_LIMIT)
		.default(DEFAULT_RECENT_LOGINS_LIMIT),
});
