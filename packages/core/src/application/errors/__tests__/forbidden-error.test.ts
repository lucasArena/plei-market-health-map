import { ForbiddenError } from "@core/application/errors/forbidden-error";

describe("ForbiddenError", () => {
	it("describes a forbidden resource", () => {
		const error = new ForbiddenError("market");
		expect(error).toMatchObject({
			code: "FORBIDDEN",
			message: "You are not allowed to access this market.",
		});
	});
});
