export class UnauthorizedError extends Error {
	readonly code = "UNAUTHORIZED";

	constructor() {
		super("Authentication is required.");
		this.name = "UnauthorizedError";
	}
}

export class NotFoundError extends Error {
	readonly code = "NOT_FOUND";

	constructor(resource: string) {
		super(`${resource} was not found.`);
		this.name = "NotFoundError";
	}
}

export class ForbiddenError extends Error {
	readonly code = "FORBIDDEN";

	constructor(resource: string) {
		super(`You are not allowed to access this ${resource}.`);
		this.name = "ForbiddenError";
	}
}

export class InvalidRequestError extends Error {
	readonly code = "VALIDATION_ERROR";
	readonly details: unknown;

	constructor(details: unknown) {
		super("The request is invalid.");
		this.name = "InvalidRequestError";
		this.details = details;
	}
}

export class PayloadTooLargeError extends Error {
	readonly code = "PAYLOAD_TOO_LARGE";

	constructor(limitBytes: number) {
		super(`The request is larger than ${limitBytes} bytes.`);
		this.name = "PayloadTooLargeError";
	}
}

export class FeedbackNotConfiguredError extends Error {
	readonly code = "FEEDBACK_NOT_CONFIGURED";

	constructor() {
		super("Feedback is not configured on this server.");
		this.name = "FeedbackNotConfiguredError";
	}
}

export class IssueTrackerError extends Error {
	readonly code = "ISSUE_TRACKER_FAILED";

	constructor(message: string, options?: ErrorOptions) {
		super(message, options);
		this.name = "IssueTrackerError";
	}
}
