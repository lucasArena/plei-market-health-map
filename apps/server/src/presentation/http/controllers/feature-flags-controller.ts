import { InvalidRequestError } from "@market-health-map/core/application";
import type { ApiEnv, ApiServices } from "@server/presentation/http/api-app.types";
import { requireAdmin } from "@server/presentation/http/require-admin";
import { ok } from "@server/presentation/http/respond";
import { Hono } from "hono";

async function readEnabled(request: Request): Promise<unknown> {
	try {
		const body = (await request.json()) as { enabled?: unknown } | null;
		return body?.enabled;
	} catch {
		throw new InvalidRequestError([{ path: [], message: "The request body is not JSON." }]);
	}
}

export function featureFlagsController(services: () => ApiServices) {
	return new Hono<ApiEnv>()
		.get("/", async () => ok(await services().listEnabledFeatureFlags()))
		.get("/all", requireAdmin, async () => ok(await services().listFeatureFlags()))
		.put("/:key", requireAdmin, async (context) =>
			ok(
				await services().setFeatureFlag({
					key: context.req.param("key"),
					enabled: await readEnabled(context.req.raw),
					updatedBy: context.get("principal").email,
				}),
			),
		);
}
