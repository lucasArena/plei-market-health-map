import { toDomainLoginEvent, toLoginEventRecord } from "@infra/database/login-event-record";
import { asEntityId, LoginEvent } from "@market-health-map/domain";

const ROW = {
	id: "3f2504e0-4f89-41d3-9a0c-0305e82c3301",
	userId: "user_1",
	sessionId: "sess_1",
	email: "dev@plei.com",
	signedInAt: new Date("2026-09-28T10:00:00.000Z"),
};

describe("login event record mapper", () => {
	it("round-trips a row through the domain entity", () => {
		expect(toLoginEventRecord(toDomainLoginEvent(ROW))).toEqual(ROW);
	});

	it("restores the entity with a branded id", () => {
		const event = toDomainLoginEvent(ROW);
		expect(event).toBeInstanceOf(LoginEvent);
		expect(event.id).toBe(asEntityId(ROW.id));
	});
});
