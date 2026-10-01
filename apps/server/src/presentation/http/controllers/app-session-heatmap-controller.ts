import { appSessionFiltersSchema } from "@market-health-map/core/application";
import type { ApiServices } from "@server/presentation/http/api-app.types";
import { ok } from "@server/presentation/http/respond";
import { Hono } from "hono";

export function appSessionHeatmapController(services: () => ApiServices) {
	return new Hono()
		.get("/filters", async () => ok(await services().listAppSessionFilterOptions()))
		.get("/", async (context) =>
			ok(
				await services().listAppSessionHeatmap(
					appSessionFiltersSchema.parse({
						...context.req.query(),
						...Object.fromEntries(
							["gender", "skill"].flatMap((key) => {
								const values = context.req.queries(key);
								return values && values.length > 1 ? [[key, values]] : [];
							}),
						),
					}),
				),
			),
		);
}
