import { PayloadTooLargeError } from "@core/application/errors/payload-too-large-error";

describe("PayloadTooLargeError", () => {
	it("describes a request that is too large", () => {
		expect(new PayloadTooLargeError(10)).toMatchObject({
			code: "PAYLOAD_TOO_LARGE",
			message: "The request is larger than 10 bytes.",
		});
	});
});
