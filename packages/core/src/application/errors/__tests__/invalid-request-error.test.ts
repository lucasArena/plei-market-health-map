import { InvalidRequestError } from "@core/application/errors/invalid-request-error";

describe("InvalidRequestError", () => {
	it("carries validation details", () => {
		const error = new InvalidRequestError([{ path: ["message"] }]);
		expect(error).toMatchObject({ code: "VALIDATION_ERROR", details: [{ path: ["message"] }] });
	});
});
