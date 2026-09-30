import {
	FeedbackNotConfiguredError,
	ForbiddenError,
	InvalidRequestError,
	IssueTrackerError,
	NotFoundError,
	PayloadTooLargeError,
	UnauthorizedError,
} from "@core/application/errors/use-case-error";

describe("use-case errors", () => {
	it("describes an unauthorized request", () => {
		const error = new UnauthorizedError();
		expect(error).toMatchObject({ code: "UNAUTHORIZED", name: "UnauthorizedError" });
	});

	it("describes a missing resource", () => {
		const error = new NotFoundError("Market");
		expect(error).toMatchObject({ code: "NOT_FOUND", message: "Market was not found." });
	});

	it("describes a forbidden resource", () => {
		const error = new ForbiddenError("market");
		expect(error).toMatchObject({
			code: "FORBIDDEN",
			message: "You are not allowed to access this market.",
		});
	});
});

describe("feedback errors", () => {
	it("carries validation details", () => {
		const error = new InvalidRequestError([{ path: ["message"] }]);
		expect(error).toMatchObject({ code: "VALIDATION_ERROR", details: [{ path: ["message"] }] });
	});

	it("describes a request that is too large", () => {
		expect(new PayloadTooLargeError(10)).toMatchObject({
			code: "PAYLOAD_TOO_LARGE",
			message: "The request is larger than 10 bytes.",
		});
	});

	it("describes a server without feedback configured", () => {
		expect(new FeedbackNotConfiguredError()).toMatchObject({ code: "FEEDBACK_NOT_CONFIGURED" });
	});

	it("keeps the issue tracker's cause", () => {
		const cause = new Error("socket hang up");
		const error = new IssueTrackerError("Could not reach Linear.", { cause });
		expect(error).toMatchObject({ code: "ISSUE_TRACKER_FAILED", cause });
	});
});
