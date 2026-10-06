import { appSessionFiltersSchema, type StatsPeriod } from "@market-health-map/core/application";
import type { ApiServices } from "@server/presentation/http/api-app.types";
import { ok } from "@server/presentation/http/respond";
import { Hono } from "hono";

export function appSessionHeatmapController(services: () => ApiServices) {
	return new Hono()
		.get("/filters", async () => ok(await services().listAppSessionFilterOptions()))
		.get("/", async (context) => {
			const { period, ...query } = context.req.query();
			return ok(
				await services().listAppSessionHeatmap(
					appSessionFiltersSchema.parse({
						...query,
						...Object.fromEntries(
							["gender", "skill"].flatMap((key) => {
								const values = context.req.queries(key);
								return values && values.length > 1 ? [[key, values]] : [];
							}),
						),
					}),
					period as StatsPeriod | undefined,
				),
			);
		});
}
