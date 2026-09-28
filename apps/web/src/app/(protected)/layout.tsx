import { AppHeader } from "@/components/layout/AppHeader/AppHeaderComponent";
import { trackCurrentLogin } from "@/server/auth/track-current-login";

export default async function ProtectedLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	await trackCurrentLogin();
	return (
		<main className="relative h-dvh overflow-hidden bg-background">
			<AppHeader />
			{children}
		</main>
	);
}
