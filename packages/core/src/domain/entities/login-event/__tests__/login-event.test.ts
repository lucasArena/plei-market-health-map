import { LoginEvent } from "@core/domain/entities/login-event/login-event";
import { ValidationError } from "@core/domain/shared/domain-error";
import { asEntityId } from "@core/domain/shared/id";

const ID = asEntityId("3f2504e0-4f89-41d3-9a0c-0305e82c3301");
const NOW = new Date("2026-09-28T10:00:00.000Z");
const VALID = {
	id: ID,
	userId: " user_123 ",
	sessionId: " sess_456 ",
	email: " Dev@Plei.com ",
	signedInAt: NOW,
};

describe("LoginEvent", () => {
	it("creates a normalized login event", () => {
		const event = LoginEvent.create(VALID);

		expect(event.toJSON()).toEqual({
			id: ID,
			userId: "user_123",
			sessionId: "sess_456",
			email: "dev@plei.com",
			signedInAt: NOW,
		});
		expect(event.id).toBe(ID);
		expect(event.userId).toBe("user_123");
		expect(event.sessionId).toBe("sess_456");
		expect(event.signedInAt).toBe(NOW);
	});

	it("rejects a blank user id", () => {
		expect(() => LoginEvent.create({ ...VALID, userId: " " })).toThrow(ValidationError);
	});

	it("rejects an oversized session id", () => {
		expect(() => LoginEvent.create({ ...VALID, sessionId: "s".repeat(192) })).toThrow(
			ValidationError,
		);
	});

	it("rejects an invalid email", () => {
		expect(() => LoginEvent.create({ ...VALID, email: "nope" })).toThrow(ValidationError);
	});

	it("restores persisted props without revalidating", () => {
		const props = { ...VALID, email: "RAW" };
		expect(LoginEvent.restore(props).toJSON()).toEqual(props);
	});

	it("returns a copy from toJSON", () => {
		const event = LoginEvent.create(VALID);
		const json = event.toJSON();
		json.email = "changed@plei.com";
		expect(event.toJSON().email).toBe("dev@plei.com");
	});
});
