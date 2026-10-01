import { notFound } from "next/navigation";
import { getInternalAccess } from "@/infrastructure/auth/internal-access";
import { FeatureFlagsScreen } from "@/presentation/screens/FeatureFlagsScreen/FeatureFlagsScreenComponent";

export default async function FeatureFlagsPage() {
	const access = await getInternalAccess();
	if (access.status !== "allowed" || !access.isAdmin) notFound();
	return <FeatureFlagsScreen />;
}
