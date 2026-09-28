import { ForbiddenError, NotFoundError, UnauthorizedError } from "@market-health-map/application";
import { ValidationError } from "@market-health-map/domain";
import type { Messages } from "@market-health-map/i18n";
import { ZodError } from "zod";
import { fail } from "@/server/api/respond";

export function toErrorResponse(error: unknown, messages: Messages): Response {
	if (error instanceof ZodError) {
		return fail("VALIDATION_ERROR", messages.errors.invalidRequest, 422, error.issues);
	}
	if (error instanceof ValidationError) return fail(error.code, error.message, 422);
	if (error instanceof UnauthorizedError)
		return fail(error.code, messages.errors.unauthorized, 401);
	if (error instanceof ForbiddenError) return fail(error.code, messages.errors.forbidden, 403);
	if (error instanceof NotFoundError) return fail(error.code, messages.errors.notFound, 404);
	console.error("[api-error]", error instanceof Error ? error.stack : String(error));
	return fail("INTERNAL_ERROR", messages.errors.internal, 500);
}
