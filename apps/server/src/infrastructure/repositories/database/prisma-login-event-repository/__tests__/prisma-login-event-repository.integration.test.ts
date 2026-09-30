import { asEntityId, LoginEvent } from "@market-health-map/core/domain";
import { getPrismaClient } from "@server/infrastructure/repositories/database/prisma-client/prisma-client";
import { PrismaLoginEventRepository } from "@server/infrastructure/repositories/database/prisma-login-event-repository/prisma-login-event-repository";

const SESSION_ID = "sess_integration";
const prisma = getPrismaClient(process.env.DATABASE_URL ?? "");
const repository = new PrismaLoginEventRepository(prisma);

afterAll(async () => {
	await prisma.loginEvent.deleteMany({ where: { sessionId: SESSION_ID } });
	await prisma.$disconnect();
});

describe("PrismaLoginEventRepository (integration)", () => {
	it("saves once per session and lists newest first", async () => {
		const event = LoginEvent.create({
			id: asEntityId("cccccccc-cccc-4ccc-8ccc-cccccccccccc"),
			userId: "user_integration",
			sessionId: SESSION_ID,
			email: "integration@plei.com",
			signedInAt: new Date(),
		});

		await repository.save(event);
		await repository.save(event);

		expect((await repository.findBySessionId(SESSION_ID))?.toJSON().email).toBe(
			"integration@plei.com",
		);
		expect((await repository.listRecent(1))[0]?.sessionId).toBe(SESSION_ID);
	});
});
