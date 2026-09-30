import { redirect } from "next/navigation";
import { getInternalAccess } from "@/infrastructure/auth/internal-access";
import { signInErrorUrl } from "@/infrastructure/auth/sign-in-policy";
import { AppHeader } from "@/presentation/components/layout/AppHeader/AppHeaderComponent";
import { MapLayersPanel } from "@/presentation/components/map/MapLayersPanel/MapLayersPanelComponent";
import { MapLayersProvider } from "@/presentation/components/map/MapLayersPanel/MapLayersPanelComponent.context";

export default async function ProtectedLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const access = await getInternalAccess();
	if (access.status === "anonymous") redirect("/sign-in");
	if (access.status === "denied") redirect(signInErrorUrl("domain", access.email) as "/sign-in");
	return (
		<MapLayersProvider>
			<main className="relative h-dvh overflow-hidden bg-background">
				<AppHeader user={{ name: access.name, email: access.email, image: access.image }} />
				<MapLayersPanel />
				{children}
			</main>
		</MapLayersProvider>
	);
}
