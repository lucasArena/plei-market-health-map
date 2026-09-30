export class IssueTrackerError extends Error {
	readonly code = "ISSUE_TRACKER_FAILED";

	constructor(message: string, options?: ErrorOptions) {
		super(message, options);
		this.name = "IssueTrackerError";
	}
}
