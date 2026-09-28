import { randomUUID } from "node:crypto";
import type { LoginEventView } from "@market-health-map/application";
import { isLoginTrackingConfigured } from "@/env";
import type { SignInIdentity } from "@/server/auth/track-sign-in.types";
import { getContainer } from "@/server/container";

let hasWarnedDisabled = false;

function warnTrackingDisabled() {
	if (hasWarnedDisabled) return;
	hasWarnedDisabled = true;
	console.warn("[track-login] DATABASE_URL is not set, so sign-ins are not being recorded.");
}

export async function trackSignIn({
	userId,
	email,
}: SignInIdentity): Promise<LoginEventView | null> {
	try {
		if (!isLoginTrackingConfigured()) {
			warnTrackingDisabled();
			return null;
		}
		if (!userId || !email) return null;
		return await getContainer().recordLogin({ userId, sessionId: randomUUID(), email });
	} catch (error) {
		console.error("[track-login]", error instanceof Error ? error.stack : String(error));
		return null;
	}
}
