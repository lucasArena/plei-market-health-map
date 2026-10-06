import { notFound, redirect } from "next/navigation";
import { getInternalAccess } from "@/infrastructure/auth/internal-access";

export default async function AdminControlsPage() {
	const access = await getInternalAccess();
	if (access.status !== "allowed" || !access.isAdmin) notFound();
	redirect("/admin/metrics");
}
