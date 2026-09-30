import { hasEmailDomain } from "@market-health-map/core/domain";
import { canViewAppMetrics, getAllowedEmailDomain } from "@market-health-map/server";
import { auth } from "@/infrastructure/auth/auth";
import type { InternalAccess } from "@/infrastructure/auth/internal-access.types";

export async function getInternalAccess(): Promise<InternalAccess> {
	const session = await auth();
	const email = session?.user?.email;
	if (!email) return { status: "anonymous" };
	if (!hasEmailDomain(email, getAllowedEmailDomain())) return { status: "denied", email };
	return {
		status: "allowed",
		userId: session.user?.id ?? email,
		email,
		name: session.user?.name ?? null,
		image: session.user?.image ?? null,
		canViewAppMetrics: canViewAppMetrics(email),
	};
}
