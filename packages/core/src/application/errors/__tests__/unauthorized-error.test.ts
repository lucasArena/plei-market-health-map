import { UnauthorizedError } from "@core/application/errors/unauthorized-error";

describe("UnauthorizedError", () => {
	it("describes an unauthorized request", () => {
		const error = new UnauthorizedError();
		expect(error).toMatchObject({ code: "UNAUTHORIZED", name: "UnauthorizedError" });
	});
});
