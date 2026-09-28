import { redirect } from "next/navigation";
import { AppHeader } from "@/components/layout/AppHeader/AppHeaderComponent";
import { getInternalAccess } from "@/server/auth/internal-access";
import { signInErrorUrl } from "@/server/auth/sign-in-policy";

export default async function ProtectedLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const access = await getInternalAccess();
	if (access.status === "anonymous") redirect("/sign-in");
	if (access.status === "denied") redirect(signInErrorUrl("domain", access.email) as "/sign-in");
	return (
		<main className="relative h-dvh overflow-hidden bg-background">
			<AppHeader user={{ name: access.name, email: access.email, image: access.image }} />
			{children}
		</main>
	);
}
