import { toDomainLoginEvent, toLoginEventRecord } from "@infra/database/login-event-record";
import type { PrismaClient } from "@infra/generated/prisma/client";
import type { LoginEventRepository } from "@market-health-map/application";
import type { LoginEvent } from "@market-health-map/domain";

export class PrismaLoginEventRepository implements LoginEventRepository {
	constructor(private readonly prisma: PrismaClient) {}

	async save(event: LoginEvent): Promise<void> {
		const record = toLoginEventRecord(event);
		await this.prisma.loginEvent.upsert({
			where: { sessionId: record.sessionId },
			create: record,
			update: {},
		});
	}

	async findBySessionId(sessionId: string): Promise<LoginEvent | null> {
		const row = await this.prisma.loginEvent.findUnique({ where: { sessionId } });
		return row ? toDomainLoginEvent(row) : null;
	}

	async listRecent(limit: number): Promise<LoginEvent[]> {
		const rows = await this.prisma.loginEvent.findMany({
			orderBy: { signedInAt: "desc" },
			take: limit,
		});
		return rows.map(toDomainLoginEvent);
	}
}
