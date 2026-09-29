import { randomUUID } from "node:crypto";
import type { LoginEventView } from "@market-health-map/core/application";
import { getContainer } from "@server/container";
import { isLoginTrackingConfigured } from "@server/env";
import type { SignInIdentity } from "@server/presentation/auth/track-sign-in.types";

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
