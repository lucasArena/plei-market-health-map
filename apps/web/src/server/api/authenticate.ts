import { auth } from "@clerk/nextjs/server";
import { UnauthorizedError } from "@market-health-map/application";
import type { AuthenticatedPrincipal } from "@/server/api/authenticate.types";

export async function requireUser(): Promise<AuthenticatedPrincipal> {
	const { userId, sessionId } = await auth();
	if (!userId || !sessionId) throw new UnauthorizedError();
	return { userId, sessionId };
}
