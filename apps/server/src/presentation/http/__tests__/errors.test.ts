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
import { toErrorResponse } from "@server/presentation/http/errors";
import type { ApiTestBody } from "@server/testing/api-response.types";
import { EN_MESSAGES } from "@server/testing/messages";
import { z } from "zod";

async function mapped(error: unknown) {
	const response = toErrorResponse(error, EN_MESSAGES);
	return { status: response.status, body: (await response.json()) as ApiTestBody };
}

describe("toErrorResponse", () => {
	it("maps zod errors to 422 with issues", async () => {
		const result = z.object({ a: z.string() }).safeParse({});
		const { status, body } = await mapped(result.error);
		expect(status).toBe(422);
		expect(body.error.code).toBe("VALIDATION_ERROR");
		expect(body.error.details).toHaveLength(1);
	});

	it("maps invalid requests to 400 with details", async () => {
		const { status, body } = await mapped(new InvalidRequestError([{ path: ["message"] }]));
		expect(status).toBe(400);
		expect(body.error).toEqual({
			code: "VALIDATION_ERROR",
			message: EN_MESSAGES.errors.invalidRequest,
			details: [{ path: ["message"] }],
		});
	});

	it("maps oversized requests to 413 with localized copy", async () => {
		const { status, body } = await mapped(new PayloadTooLargeError(4));
		expect(status).toBe(413);
		expect(body.error).toEqual({
			code: "PAYLOAD_TOO_LARGE",
			message: EN_MESSAGES.errors.payloadTooLarge,
		});
	});

	it("maps a server without feedback configured to 503", async () => {
		const { status, body } = await mapped(new FeedbackNotConfiguredError());
		expect(status).toBe(503);
		expect(body.error).toEqual({
			code: "FEEDBACK_NOT_CONFIGURED",
			message: EN_MESSAGES.errors.feedbackNotConfigured,
		});
	});

	it("maps issue tracker failures to 502 and logs the cause", async () => {
		const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
		const cause = new Error("socket hang up");
		const { status, body } = await mapped(
			new IssueTrackerError("Could not reach Linear.", { cause }),
		);
		expect(status).toBe(502);
		expect(body.error.code).toBe("ISSUE_TRACKER_FAILED");
		expect(body.error.message).toBe(EN_MESSAGES.errors.feedbackDeliveryFailed);
		expect(spy).toHaveBeenCalledWith("[issue-tracker]", "Could not reach Linear.", cause);
		await mapped(new IssueTrackerError("Linear did not create the issue."));
		expect(spy).toHaveBeenLastCalledWith("[issue-tracker]", "Linear did not create the issue.", "");
		spy.mockRestore();
	});

	it("maps domain validation errors to 422", async () => {
		expect((await mapped(new ValidationError("bad"))).status).toBe(422);
	});

	it("maps unauthorized to 401 with localized copy", async () => {
		const { status, body } = await mapped(new UnauthorizedError());
		expect(status).toBe(401);
		expect(body.error.message).toBe(EN_MESSAGES.errors.unauthorized);
	});

	it("maps forbidden to 403", async () => {
		expect((await mapped(new ForbiddenError("market"))).status).toBe(403);
	});

	it("maps not found to 404", async () => {
		expect((await mapped(new NotFoundError("Market"))).status).toBe(404);
	});

	it("hides unknown errors behind a 500", async () => {
		const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
		const { status, body } = await mapped(new Error("boom"));
		expect(status).toBe(500);
		expect(body.error.message).toBe(EN_MESSAGES.errors.internal);
		await mapped("raw");
		expect(spy).toHaveBeenCalledWith("[api-error]", "raw");
		spy.mockRestore();
	});
});
