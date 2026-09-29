import type { ApiServices } from "@server/presentation/http/api-app.types";
import { ok } from "@server/presentation/http/respond";
import { Hono } from "hono";

export function loginRoutes(services: () => ApiServices) {
	return new Hono().get("/", async (context) =>
		ok(await services().listRecentLogins({ limit: context.req.query("limit") })),
	);
}
