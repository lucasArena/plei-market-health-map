import { getAllowedEmailDomain } from "@market-health-map/server";
import { redirect } from "next/navigation";
import { getInternalAccess } from "@/infrastructure/auth/internal-access";
import { SignInScreen } from "@/presentation/screens/SignInScreen/SignInScreenComponent";

export default async function SignInPage({
	searchParams,
}: Readonly<{ searchParams: Promise<{ error?: string; email?: string }> }>) {
	const [{ error, email }, access] = await Promise.all([searchParams, getInternalAccess()]);
	if (access.status === "allowed") redirect("/");
	return (
		<SignInScreen error={error ?? null} email={email ?? null} domain={getAllowedEmailDomain()} />
	);
}
