import type { ApiServices } from "@server/presentation/http/api-app.types";
import { ok } from "@server/presentation/http/respond";
import { Hono } from "hono";

export function facilityRoutes(services: () => ApiServices) {
	return new Hono()
		.get("/", async () => ok(await services().listFacilities()))
		.get("/:facilityId/reservations", async (context) =>
			ok(
				await services().getFacilityReservationStats({
					facilityId: context.req.param("facilityId"),
				}),
			),
		)
		.get("/:facilityId/players", async (context) =>
			ok(
				await services().getFacilityPlayerStats({
					facilityId: context.req.param("facilityId"),
				}),
			),
		)
		.get("/:facilityId", async (context) =>
			ok(await services().getFacilityDetail({ facilityId: context.req.param("facilityId") })),
		);
}
