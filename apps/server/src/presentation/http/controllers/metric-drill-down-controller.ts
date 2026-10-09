import type { GetMetricDrillDownInput } from "@market-health-map/core/application";
import type { ApiServices } from "@server/presentation/http/api-app.types";
import { ok } from "@server/presentation/http/respond";
import { statsTimeZoneFrom } from "@server/presentation/http/stats-time-zone";
import { type Context, Hono } from "hono";

function departmentsFrom(context: Context): Pick<GetMetricDrillDownInput, "departments"> {
	const departments = context.req.query("departments");
	if (departments === undefined) return {};
	return {
		departments: departments
			.split(",")
			.map((department) => department.trim())
			.filter(Boolean) as GetMetricDrillDownInput["departments"],
	};
}

export function metricDrillDownController(services: () => ApiServices) {
	return new Hono().get("/", async (context) =>
		ok(
			await services().getMetricDrillDown({
				comparison: context.req.query("comparison") as GetMetricDrillDownInput["comparison"],
				measure: context.req.query("measure") as GetMetricDrillDownInput["measure"],
				range: context.req.query("range") as GetMetricDrillDownInput["range"],
				slice: context.req.query("slice") as GetMetricDrillDownInput["slice"],
				segment: context.req.query("segment") as GetMetricDrillDownInput["segment"],
				marketId: context.req.query("marketId") ?? undefined,
				facilityId: context.req.query("facilityId") ?? undefined,
				department: context.req.query("department") as GetMetricDrillDownInput["department"],
				grain: context.req.query("grain") as GetMetricDrillDownInput["grain"],
				...departmentsFrom(context),
				...statsTimeZoneFrom(context),
			}),
		),
	);
}
