import { PrismaClient } from "@infra/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export function getPrismaClient(connectionString: string): PrismaClient {
	if (globalForPrisma.prisma) return globalForPrisma.prisma;
	const client = new PrismaClient({
		adapter: new PrismaNeon({ connectionString }),
		log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
	});
	if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = client;
	return client;
}
