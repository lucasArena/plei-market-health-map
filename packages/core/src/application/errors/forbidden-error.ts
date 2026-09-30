export class ForbiddenError extends Error {
	readonly code = "FORBIDDEN";

	constructor(resource: string) {
		super(`You are not allowed to access this ${resource}.`);
		this.name = "ForbiddenError";
	}
}
