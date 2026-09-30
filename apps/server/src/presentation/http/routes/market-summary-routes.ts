import type { ApiServices } from "@server/presentation/http/api-app.types";
import { ok } from "@server/presentation/http/respond";
import { Hono } from "hono";

export function marketSummaryRoutes(services: () => ApiServices) {
	return new Hono()
		.get("/", async () => ok(await services().getMarketSummary()))
		.get("/players", async () => ok(await services().getMarketPlayerStats()));
}
