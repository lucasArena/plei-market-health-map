import { redirect } from "next/navigation";
import { getInternalAccess } from "@/infrastructure/auth/internal-access";
import { signInErrorUrl } from "@/infrastructure/auth/sign-in-policy";
import { AppHeader } from "@/presentation/components/layout/AppHeader/AppHeaderComponent";
import { MapLayersPanel } from "@/presentation/components/map/MapLayersPanel/MapLayersPanelComponent";
import { MapLayersProvider } from "@/presentation/components/map/MapLayersPanel/MapLayersPanelComponent.context";
import { ActivityTracker } from "@/presentation/components/providers/ActivityTracker/ActivityTrackerComponent";

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
				<ActivityTracker />
				<AppHeader
					user={{
						name: access.name,
						email: access.email,
						image: access.image,
						isAdmin: access.isAdmin,
					}}
				/>
				<MapLayersPanel />
				{children}
			</main>
		</MapLayersProvider>
	);
}
