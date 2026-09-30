export class FeedbackNotConfiguredError extends Error {
	readonly code = "FEEDBACK_NOT_CONFIGURED";

	constructor() {
		super("Feedback is not configured on this server.");
		this.name = "FeedbackNotConfiguredError";
	}
}
