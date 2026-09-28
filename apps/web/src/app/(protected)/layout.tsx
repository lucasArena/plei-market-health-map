import { AppHeader } from "@/components/layout/AppHeader/AppHeaderComponent";
import { trackCurrentLogin } from "@/server/auth/track-current-login";

export default async function ProtectedLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	await trackCurrentLogin();
	return (
		<div className="flex h-dvh flex-col bg-background">
			<AppHeader />
			<main className="relative min-h-0 flex-1 overflow-auto">{children}</main>
		</div>
	);
}
