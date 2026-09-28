import { hasEmailDomain } from "@market-health-map/domain";
import type { SignInCandidate } from "@/server/auth/sign-in-policy.types";

export function signInErrorUrl(error: string, email?: string): string {
	const params = new URLSearchParams({ error });
	if (email) params.set("email", email);
	return `/sign-in?${params.toString()}`;
}

export function evaluateSignIn({ email, emailVerified, domain }: SignInCandidate): true | string {
	if (!email) return signInErrorUrl("missing-email");
	if (emailVerified === false || !hasEmailDomain(email, domain)) {
		return signInErrorUrl("domain", email);
	}
	return true;
}
