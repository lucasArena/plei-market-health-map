import { z } from "zod";

export const serverEnvSchema = z.object({
	DATABASE_URL: z.url(),
	CLERK_SECRET_KEY: z.string().min(1),
	NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
});

let cached: z.infer<typeof serverEnvSchema> | undefined;

export function getServerEnv() {
	cached ??= serverEnvSchema.parse(process.env);
	return cached;
}

export function resetServerEnvCache() {
	cached = undefined;
}
