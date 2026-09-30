import { makeListRecentLogins } from "@core/application/services/list-recent-logins";
import { InMemoryLoginEventRepository } from "@core/application/testing/in-memory-login-event-repository";
import { asEntityId, LoginEvent } from "@core/domain";

function eventAt(index: number) {
	return LoginEvent.create({
		id: asEntityId(`id-${index}`),
		userId: `user_${index}`,
		sessionId: `sess_${index}`,
		email: `user${index}@plei.com`,
		signedInAt: new Date(Date.UTC(2026, 8, index)),
	});
}

async function setup(count: number) {
	const loginEvents = new InMemoryLoginEventRepository();
	for (let index = 1; index <= count; index += 1) {
		await loginEvents.save(eventAt(index));
	}
	return makeListRecentLogins({ loginEvents });
}

describe("listRecentLogins", () => {
	it("returns the newest logins first with the default limit", async () => {
		const listRecentLogins = await setup(25);

		const views = await listRecentLogins();

		expect(views).toHaveLength(20);
		expect(views[0]?.userId).toBe("user_25");
	});

	it("honours an explicit limit", async () => {
		const listRecentLogins = await setup(5);

		expect(await listRecentLogins({ limit: "2" })).toHaveLength(2);
	});

	it("rejects a limit above the maximum", async () => {
		const listRecentLogins = await setup(1);

		await expect(listRecentLogins({ limit: 101 })).rejects.toThrow();
	});
});
