import type { ApiServices } from "@server/presentation/http/api-app.types";
import { ok } from "@server/presentation/http/respond";
import { statsTimeZoneFrom } from "@server/presentation/http/stats-time-zone";
import { Hono } from "hono";

export function facilityController(services: () => ApiServices) {
	return new Hono()
		.get("/", async (context) => ok(await services().listFacilities(statsTimeZoneFrom(context))))
		.get("/:facilityId/reservations", async (context) =>
			ok(
				await services().getFacilityReservationStats({
					facilityId: context.req.param("facilityId"),
					...statsTimeZoneFrom(context),
				}),
			),
		)
		.get("/:facilityId/players", async (context) =>
			ok(
				await services().getFacilityPlayerStats({
					facilityId: context.req.param("facilityId"),
					...statsTimeZoneFrom(context),
				}),
			),
		)
		.get("/:facilityId/quality", async (context) =>
			ok(
				await services().getFacilityQuality({
					facilityId: context.req.param("facilityId"),
					...statsTimeZoneFrom(context),
				}),
			),
		)
		.get("/:facilityId", async (context) =>
			ok(
				await services().getFacilityDetail({
					facilityId: context.req.param("facilityId"),
					...statsTimeZoneFrom(context),
				}),
			),
		);
}
