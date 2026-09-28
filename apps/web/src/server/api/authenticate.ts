import { ForbiddenError, UnauthorizedError } from "@market-health-map/application";
import type { AuthenticatedPrincipal } from "@/server/api/authenticate.types";
import { getInternalAccess } from "@/server/auth/internal-access";

export async function requireUser(): Promise<AuthenticatedPrincipal> {
	const access = await getInternalAccess();
	if (access.status === "anonymous") throw new UnauthorizedError();
	if (access.status === "denied") throw new ForbiddenError("application");
	return { userId: access.userId, email: access.email };
}
