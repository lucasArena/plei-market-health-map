import { ForbiddenError, UnauthorizedError } from "@market-health-map/core/application";
import type {
	AuthenticatedPrincipal,
	ResolveAccess,
} from "@server/presentation/http/authenticate.types";

export async function requireUser(
	resolveAccess: ResolveAccess,
	request: Request,
): Promise<AuthenticatedPrincipal> {
	const access = await resolveAccess(request);
	if (access.status === "anonymous") throw new UnauthorizedError();
	if (access.status === "denied") throw new ForbiddenError("application");
	return { userId: access.userId, email: access.email, name: access.name };
}
