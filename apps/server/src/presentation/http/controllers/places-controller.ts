import type { ApiServices } from "@server/presentation/http/api-app.types";
import { ok } from "@server/presentation/http/respond";
import { Hono } from "hono";

export function placesController(services: () => ApiServices) {
	return new Hono().get("/", async (context) =>
		ok(await services().searchPlaces({ query: context.req.query("q") ?? "" })),
	);
}
