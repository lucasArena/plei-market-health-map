import { redirect } from "next/navigation";
import { SignInScreen } from "@/components/auth/SignInScreen/SignInScreenComponent";
import { getAllowedEmailDomain } from "@/env";
import { getInternalAccess } from "@/server/auth/internal-access";

export default async function SignInPage({
	searchParams,
}: Readonly<{ searchParams: Promise<{ error?: string; email?: string }> }>) {
	const [{ error, email }, access] = await Promise.all([searchParams, getInternalAccess()]);
	if (access.status === "allowed") redirect("/");
	return (
		<SignInScreen error={error ?? null} email={email ?? null} domain={getAllowedEmailDomain()} />
	);
}
