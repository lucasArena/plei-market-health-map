import { auth, currentUser } from "@clerk/nextjs/server";
import type { LoginEventView } from "@market-health-map/application";
import { getContainer } from "@/server/container";

export async function trackCurrentLogin(): Promise<LoginEventView | null> {
	const { userId, sessionId } = await auth();
	if (!userId || !sessionId) return null;

	const user = await currentUser();
	const email = user?.primaryEmailAddress?.emailAddress;
	if (!email) return null;

	try {
		return await getContainer().recordLogin({ userId, sessionId, email });
	} catch (error) {
		console.error("[track-login]", error instanceof Error ? error.stack : String(error));
		return null;
	}
}
