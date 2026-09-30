import type { ApiServices } from "@server/presentation/http/api-app.types";
import { ok } from "@server/presentation/http/respond";
import { Hono } from "hono";

export function appSessionHeatmapController(services: () => ApiServices) {
	return new Hono().get("/", async () => ok(await services().listAppSessionHeatmap()));
}
