import { NotFoundError } from "@market-health-map/core/application";
import { getMessages, parseAcceptLanguage } from "@market-health-map/core/i18n";
import { getContainer } from "@server/container";
import type { ApiEnv, CreateApiAppOptions } from "@server/presentation/http/api-app.types";
import { requireUser } from "@server/presentation/http/authenticate";
import { activityController } from "@server/presentation/http/controllers/activity-controller";
import { appSessionHeatmapController } from "@server/presentation/http/controllers/app-session-heatmap-controller";
import { facilityController } from "@server/presentation/http/controllers/facility-controller";
import { featureFlagsController } from "@server/presentation/http/controllers/feature-flags-controller";
import { feedbackController } from "@server/presentation/http/controllers/feedback-controller";
import { loginController } from "@server/presentation/http/controllers/login-controller";
import { marketSummaryController } from "@server/presentation/http/controllers/market-summary-controller";
import { metricsController } from "@server/presentation/http/controllers/metrics-controller";
import { toErrorResponse } from "@server/presentation/http/errors";
import { Hono } from "hono";

export const API_BASE_PATH = "/api/v1";

export function createApiApp({ resolveAccess, services = getContainer }: CreateApiAppOptions) {
	return new Hono<ApiEnv>()
		.basePath(API_BASE_PATH)
		.use(async (context, next) => {
			context.set("principal", await requireUser(resolveAccess, context.req.raw));
			await next();
		})
		.route("/facilities", facilityController(services))
		.route("/market-summary", marketSummaryController(services))
		.route("/app-session-heatmap", appSessionHeatmapController(services))
		.route("/logins", loginController(services))
		.route("/feedback", feedbackController(services))
		.route("/activity", activityController(services))
		.route("/metrics", metricsController(services))
		.route("/feature-flags", featureFlagsController(services))
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
