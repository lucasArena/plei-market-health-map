import { type ActivityReport, InvalidRequestError } from "@market-health-map/core/application";
import type { ApiEnv, ApiServices } from "@server/presentation/http/api-app.types";
import { Hono } from "hono";

export const MAX_ACTIVITY_REPORT_BYTES = 2048;

function parseReport(body: string): unknown {
	if (body.length > MAX_ACTIVITY_REPORT_BYTES) {
		throw new InvalidRequestError([{ path: [], message: "The activity report is too large." }]);
	}
	if (body.trim() === "") return {};
	try {
		return JSON.parse(body);
	} catch {
		throw new InvalidRequestError([{ path: [], message: "The activity report is not JSON." }]);
	}
}

export function activityController(services: () => ApiServices) {
	return new Hono<ApiEnv>().post("/", async (context) => {
		const principal = context.get("principal");
		const report = parseReport(await context.req.text());
		await services().recordDailyActivity({
			user: { userId: principal.userId, email: principal.email, name: principal.name ?? null },
			report: report as ActivityReport,
		});
		return context.body(null, 204);
	});
}
