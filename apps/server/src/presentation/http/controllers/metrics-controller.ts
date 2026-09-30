import { ForbiddenError } from "@market-health-map/core/application";
import { canViewAppMetrics } from "@server/env";
import type { ApiEnv, ApiServices } from "@server/presentation/http/api-app.types";
import { ok } from "@server/presentation/http/respond";
import { Hono } from "hono";

export function metricsController(services: () => ApiServices) {
	return new Hono<ApiEnv>()
		.use(async (context, next) => {
			if (!canViewAppMetrics(context.get("principal").email)) {
				throw new ForbiddenError("page");
			}
			await next();
		})
		.get("/", async () => ok(await services().getAppMetrics()))
		.get("/people", async (context) =>
			ok(
				await services().listAppMetricsPeople({
					page: context.req.query("page"),
					pageSize: context.req.query("pageSize"),
				}),
			),
		);
}
