import {
	onFeedbackRequest,
	requestFeedback,
} from "@/presentation/hooks/use-feedback/feedback-requests";

describe("feedback requests", () => {
	it("tells every subscriber which form to open until they unsubscribe", () => {
		const listener = vi.fn();
		const unsubscribe = onFeedbackRequest(listener);

		requestFeedback("bug");
		unsubscribe();
		requestFeedback("improvement");

		expect(listener).toHaveBeenCalledTimes(1);
		expect(listener).toHaveBeenCalledWith("bug");
	});
});
