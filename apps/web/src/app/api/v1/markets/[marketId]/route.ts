import { getMessages, parseAcceptLanguage } from "@market-health-map/i18n";
import { requireUser } from "@/server/api/authenticate";
import { toErrorResponse } from "@/server/api/errors";
import { ok } from "@/server/api/respond";
import { getContainer } from "@/server/container";

export async function GET(
	request: Request,
	context: RouteContext<"/api/v1/markets/[marketId]">,
): Promise<Response> {
	const messages = getMessages(parseAcceptLanguage(request.headers.get("accept-language")));
	try {
		await requireUser();
		const { marketId } = await context.params;
		return ok(await getContainer().getMarketDetail({ marketId }));
	} catch (error) {
		return toErrorResponse(error, messages);
	}
}
