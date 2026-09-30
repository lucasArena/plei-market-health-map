export class PayloadTooLargeError extends Error {
	readonly code = "PAYLOAD_TOO_LARGE";

	constructor(limitBytes: number) {
		super(`The request is larger than ${limitBytes} bytes.`);
		this.name = "PayloadTooLargeError";
	}
}
