import type {
	GetMarketGameInsightsInput,
	GetMarketSummaryInput,
} from "@market-health-map/core/application";
import type { ApiServices } from "@server/presentation/http/api-app.types";
import { ok } from "@server/presentation/http/respond";
import { statsTimeZoneFrom } from "@server/presentation/http/stats-time-zone";
import { type Context, Hono } from "hono";

/** `?departments=magic,organizers` as a list; absent stays absent so the default call is unchanged. */
function departmentsFrom(context: Context): Pick<GetMarketSummaryInput, "departments"> {
	const departments = context.req.query("departments");
	if (departments === undefined) return {};
	return {
		departments: departments
			.split(",")
			.map((department) => department.trim())
			.filter(Boolean) as GetMarketSummaryInput["departments"],
	};
}

export function marketSummaryController(services: () => ApiServices) {
	return new Hono()
		.get("/", async (context) =>
			ok(
				await services().getMarketSummary({
					market: context.req.query("market"),
					...departmentsFrom(context),
					...statsTimeZoneFrom(context),
				}),
			),
		)
		.get("/insights", async (context) =>
			ok(
				await services().getMarketGameInsights({
					market: context.req.query("market"),
					period: context.req.query("period") as GetMarketGameInsightsInput["period"],
					...departmentsFrom(context),
					...statsTimeZoneFrom(context),
				}),
			),
		)
		.get("/players", async (context) =>
			ok(
				await services().getMarketPlayerStats({
					market: context.req.query("market"),
					...statsTimeZoneFrom(context),
				}),
			),
		);
}
