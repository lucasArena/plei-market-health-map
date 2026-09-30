import {
	FeedbackNotConfiguredError,
	ForbiddenError,
	InvalidRequestError,
	IssueTrackerError,
	NotFoundError,
	PayloadTooLargeError,
	UnauthorizedError,
} from "@market-health-map/core/application";
import { ValidationError } from "@market-health-map/core/domain";
import type { Messages } from "@market-health-map/core/i18n";
import { fail } from "@server/presentation/http/respond";
import { ZodError } from "zod";

export function toErrorResponse(error: unknown, messages: Messages): Response {
	if (error instanceof ZodError) {
		return fail("VALIDATION_ERROR", messages.errors.invalidRequest, 422, error.issues);
	}
	if (error instanceof InvalidRequestError) {
		return fail(error.code, messages.errors.invalidRequest, 400, error.details);
	}
	if (error instanceof PayloadTooLargeError) {
		return fail(error.code, messages.errors.payloadTooLarge, 413);
	}
	if (error instanceof FeedbackNotConfiguredError) {
		return fail(error.code, messages.errors.feedbackNotConfigured, 503);
	}
	if (error instanceof IssueTrackerError) {
		console.error("[issue-tracker]", error.message, error.cause ?? "");
		return fail(error.code, messages.errors.feedbackDeliveryFailed, 502);
	}
	if (error instanceof ValidationError) return fail(error.code, error.message, 422);
	if (error instanceof UnauthorizedError)
		return fail(error.code, messages.errors.unauthorized, 401);
	if (error instanceof ForbiddenError) return fail(error.code, messages.errors.forbidden, 403);
	if (error instanceof NotFoundError) return fail(error.code, messages.errors.notFound, 404);
	console.error("[api-error]", error instanceof Error ? error.stack : String(error));
	return fail("INTERNAL_ERROR", messages.errors.internal, 500);
}
