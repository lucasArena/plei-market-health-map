import { ValidationError } from "@domain/shared/domain-error";
import { guard } from "@domain/shared/guard";
import { asEntityId } from "@domain/shared/id";

describe("guard", () => {
	it("trims non-empty values", () => {
		expect(guard.notEmpty("  plei  ", "Name")).toBe("plei");
	});

	it("rejects blank values", () => {
		expect(() => guard.notEmpty("   ", "Name")).toThrow(
			new ValidationError("Name must not be empty."),
		);
	});

	it("accepts values within the max length", () => {
		expect(guard.maxLength("abc", 3, "Name")).toBe("abc");
	});

	it("rejects values over the max length", () => {
		expect(() => guard.maxLength("abcd", 3, "Name")).toThrow("Name must be at most 3 characters.");
	});

	it("normalizes valid emails", () => {
		expect(guard.email("  Dev@Plei.com ", "Email")).toBe("dev@plei.com");
	});

	it("rejects malformed emails", () => {
		expect(() => guard.email("not-an-email", "Email")).toThrow("Email must be a valid email.");
	});
});

describe("ValidationError", () => {
	it("carries a stable code and its class name", () => {
		const error = new ValidationError("bad");
		expect(error.code).toBe("VALIDATION_ERROR");
		expect(error.name).toBe("ValidationError");
	});
});

describe("asEntityId", () => {
	it("brands the raw string", () => {
		expect(asEntityId("abc")).toBe("abc");
	});
});
