import { formatMessage, type Messages } from "@market-health-map/i18n";
import type { SignInScreenProps } from "@/components/auth/SignInScreen/SignInScreenComponent.types";

export function resolveSignInError(
	{ error, email, domain }: SignInScreenProps,
	messages: Messages["auth"],
): string | null {
	if (!error) return null;
	if (error === "domain") {
		return formatMessage(messages.domainError, { email: email ?? "—", domain });
	}
	if (error === "missing-email") return messages.missingEmailError;
	return messages.genericError;
}
