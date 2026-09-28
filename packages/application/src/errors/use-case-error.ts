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
