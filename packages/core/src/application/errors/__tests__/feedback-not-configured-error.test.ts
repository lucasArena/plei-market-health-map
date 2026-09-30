import { FeedbackNotConfiguredError } from "@core/application/errors/feedback-not-configured-error";

describe("FeedbackNotConfiguredError", () => {
	it("describes a server without feedback configured", () => {
		expect(new FeedbackNotConfiguredError()).toMatchObject({ code: "FEEDBACK_NOT_CONFIGURED" });
	});
});
