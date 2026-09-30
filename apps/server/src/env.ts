import type { FeedbackMode } from "@server/env.types";
import { z } from "zod";

const emptyAsUndefined = (value: unknown) => (value === "" ? undefined : value);

export const DEFAULT_ALLOWED_EMAIL_DOMAIN = "plei.com";

export const serverEnvSchema = z.object({
	DATABASE_URL: z.preprocess(emptyAsUndefined, z.url().optional()),
	DATA_WAREHOUSE_URL: z.preprocess(emptyAsUndefined, z.url().optional()),
	ALLOWED_EMAIL_DOMAIN: z.preprocess(
		emptyAsUndefined,
		z.string().trim().min(1).default(DEFAULT_ALLOWED_EMAIL_DOMAIN),
	),
	LINEAR_API_KEY: z.preprocess(emptyAsUndefined, z.string().trim().min(1).optional()),
	FEEDBACK_DRY_RUN: z.preprocess(emptyAsUndefined, z.stringbool().default(false)),
});

let cached: z.infer<typeof serverEnvSchema> | undefined;

export function getServerEnv() {
	cached ??= serverEnvSchema.parse(process.env);
	return cached;
}

export function isLoginTrackingConfigured(): boolean {
	return getServerEnv().DATABASE_URL !== undefined;
}

export function getAllowedEmailDomain(): string {
	return getServerEnv().ALLOWED_EMAIL_DOMAIN;
}

export function getFeedbackMode(): FeedbackMode {
	const { FEEDBACK_DRY_RUN, LINEAR_API_KEY } = getServerEnv();
	if (FEEDBACK_DRY_RUN) return "dry-run";
	return LINEAR_API_KEY ? "linear" : "unconfigured";
}

export function resetServerEnvCache() {
	cached = undefined;
}
