import { FixedClock, SequentialIdGenerator } from "@core/application/testing/fakes";
import { InMemoryLoginEventRepository } from "@core/application/testing/in-memory-login-event-repository";
import { makeRecordLogin } from "@core/application/use-cases/record-login";
import { asEntityId } from "@core/domain";

const NOW = new Date("2026-09-28T10:00:00.000Z");
const FIRST = asEntityId("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
const SECOND = asEntityId("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb");
const INPUT = { userId: "user_1", sessionId: "sess_1", email: "Dev@Plei.com" };

function setup() {
	const loginEvents = new InMemoryLoginEventRepository();
	const recordLogin = makeRecordLogin({
		loginEvents,
		ids: new SequentialIdGenerator([FIRST, SECOND]),
		clock: new FixedClock(NOW),
	});
	return { loginEvents, recordLogin };
}

describe("recordLogin", () => {
	it("records a new login for an unseen session", async () => {
		const { loginEvents, recordLogin } = setup();

		const view = await recordLogin(INPUT);

		expect(view).toEqual({
			id: FIRST,
			userId: "user_1",
			email: "dev@plei.com",
			signedInAt: NOW.toISOString(),
		});
		expect(await loginEvents.findBySessionId("sess_1")).not.toBeNull();
	});

	it("is idempotent per session", async () => {
		const { loginEvents, recordLogin } = setup();

		await recordLogin(INPUT);
		const again = await recordLogin(INPUT);

		expect(again.id).toBe(FIRST);
		expect(await loginEvents.listRecent(10)).toHaveLength(1);
	});

	it("rejects invalid input", async () => {
		const { recordLogin } = setup();

		await expect(recordLogin({ ...INPUT, email: "nope" })).rejects.toThrow();
	});
});
