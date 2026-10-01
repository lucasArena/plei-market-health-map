import { ForbiddenError } from "@market-health-map/core/application";
import { isAdmin } from "@server/env";
import type { ApiEnv } from "@server/presentation/http/api-app.types";
import { createMiddleware } from "hono/factory";

export const requireAdmin = createMiddleware<ApiEnv>(async (context, next) => {
	if (!isAdmin(context.get("principal").email)) throw new ForbiddenError("page");
	await next();
});
