import type { ApiEnv, ApiServices } from "@server/presentation/http/api-app.types";
import { requireAdmin } from "@server/presentation/http/require-admin";
import { ok } from "@server/presentation/http/respond";
import { Hono } from "hono";

export function metricsController(services: () => ApiServices) {
	return new Hono<ApiEnv>()
		.use(requireAdmin)
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
