import type { GetMarketGameInsightsInput } from "@market-health-map/core/application";
import type { ApiServices } from "@server/presentation/http/api-app.types";
import { ok } from "@server/presentation/http/respond";
import { Hono } from "hono";

export function marketSummaryController(services: () => ApiServices) {
	return new Hono()
		.get("/", async (context) =>
			ok(await services().getMarketSummary({ market: context.req.query("market") })),
		)
		.get("/insights", async (context) =>
			ok(
				await services().getMarketGameInsights({
					market: context.req.query("market"),
					period: context.req.query("period") as GetMarketGameInsightsInput["period"],
				}),
			),
		)
		.get("/players", async (context) =>
			ok(await services().getMarketPlayerStats({ market: context.req.query("market") })),
		);
}
