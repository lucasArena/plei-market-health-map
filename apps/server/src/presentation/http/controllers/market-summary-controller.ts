import type { ApiServices } from "@server/presentation/http/api-app.types";
import { ok } from "@server/presentation/http/respond";
import { Hono } from "hono";

export function marketSummaryController(services: () => ApiServices) {
	return new Hono()
		.get("/", async (context) =>
			ok(await services().getMarketSummary({ market: context.req.query("market") })),
		)
		.get("/players", async (context) =>
			ok(await services().getMarketPlayerStats({ market: context.req.query("market") })),
		);
}
