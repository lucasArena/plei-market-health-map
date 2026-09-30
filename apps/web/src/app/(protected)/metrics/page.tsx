import { notFound } from "next/navigation";
import { getInternalAccess } from "@/infrastructure/auth/internal-access";
import { AppMetricsScreen } from "@/presentation/screens/AppMetricsScreen/AppMetricsScreenComponent";

export default async function AppMetricsPage() {
	const access = await getInternalAccess();
	if (access.status !== "allowed" || !access.canViewAppMetrics) notFound();
	return <AppMetricsScreen />;
}
