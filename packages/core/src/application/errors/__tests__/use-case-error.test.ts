import {
	ForbiddenError,
	NotFoundError,
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
