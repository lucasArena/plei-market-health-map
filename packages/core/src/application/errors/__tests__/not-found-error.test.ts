import { NotFoundError } from "@core/application/errors/not-found-error";

describe("NotFoundError", () => {
	it("describes a missing resource", () => {
		const error = new NotFoundError("Market");
		expect(error).toMatchObject({ code: "NOT_FOUND", message: "Market was not found." });
	});
});
