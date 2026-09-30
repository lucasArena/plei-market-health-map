export class UnauthorizedError extends Error {
	readonly code = "UNAUTHORIZED";

	constructor() {
		super("Authentication is required.");
		this.name = "UnauthorizedError";
	}
}
