import type { FeedbackMode, LinearCredentials } from "@server/env.types";
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
	LINEAR_CLIENT_ID: z.preprocess(emptyAsUndefined, z.string().trim().min(1).optional()),
	LINEAR_CLIENT_SECRET: z.preprocess(emptyAsUndefined, z.string().trim().min(1).optional()),
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

export function getLinearCredentials(): LinearCredentials | null {
	const { LINEAR_CLIENT_ID, LINEAR_CLIENT_SECRET, LINEAR_API_KEY } = getServerEnv();
	if (LINEAR_CLIENT_ID && LINEAR_CLIENT_SECRET) {
		return { kind: "app", clientId: LINEAR_CLIENT_ID, clientSecret: LINEAR_CLIENT_SECRET };
	}
	return LINEAR_API_KEY ? { kind: "api-key", apiKey: LINEAR_API_KEY } : null;
}

export function hasPartialLinearAppCredentials(): boolean {
	const { LINEAR_CLIENT_ID, LINEAR_CLIENT_SECRET } = getServerEnv();
	return Boolean(LINEAR_CLIENT_ID) !== Boolean(LINEAR_CLIENT_SECRET);
}

export function getFeedbackMode(): FeedbackMode {
	if (getServerEnv().FEEDBACK_DRY_RUN) return "dry-run";
	const credentials = getLinearCredentials();
	if (!credentials) return "unconfigured";
	return credentials.kind === "app" ? "linear-app" : "linear-api-key";
}

export function resetServerEnvCache() {
	cached = undefined;
}
