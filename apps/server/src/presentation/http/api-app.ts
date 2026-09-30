import { NotFoundError } from "@market-health-map/core/application";
import { getMessages, parseAcceptLanguage } from "@market-health-map/core/i18n";
import { getContainer } from "@server/container";
import type { ApiEnv, CreateApiAppOptions } from "@server/presentation/http/api-app.types";
import { requireUser } from "@server/presentation/http/authenticate";
import { toErrorResponse } from "@server/presentation/http/errors";
import { appSessionHeatmapRoutes } from "@server/presentation/http/routes/app-session-heatmap-routes";
import { facilityRoutes } from "@server/presentation/http/routes/facility-routes";
import { feedbackRoutes } from "@server/presentation/http/routes/feedback-routes";
import { loginRoutes } from "@server/presentation/http/routes/login-routes";
import { marketSummaryRoutes } from "@server/presentation/http/routes/market-summary-routes";
import { Hono } from "hono";

export const API_BASE_PATH = "/api/v1";

export function createApiApp({ resolveAccess, services = getContainer }: CreateApiAppOptions) {
	return new Hono<ApiEnv>()
		.basePath(API_BASE_PATH)
		.use(async (context, next) => {
			context.set("principal", await requireUser(resolveAccess, context.req.raw));
			await next();
		})
		.route("/facilities", facilityRoutes(services))
		.route("/market-summary", marketSummaryRoutes(services))
		.route("/app-session-heatmap", appSessionHeatmapRoutes(services))
		.route("/logins", loginRoutes(services))
		.route("/feedback", feedbackRoutes(services))
		.notFound(() => {
			throw new NotFoundError("Route");
		})
		.onError((error, context) =>
			toErrorResponse(
				error,
				getMessages(parseAcceptLanguage(context.req.header("accept-language") ?? null)),
			),
		);
}
