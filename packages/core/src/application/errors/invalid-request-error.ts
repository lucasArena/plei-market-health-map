export class InvalidRequestError extends Error {
	readonly code = "VALIDATION_ERROR";
	readonly details: unknown;

	constructor(details: unknown) {
		super("The request is invalid.");
		this.name = "InvalidRequestError";
		this.details = details;
	}
}
