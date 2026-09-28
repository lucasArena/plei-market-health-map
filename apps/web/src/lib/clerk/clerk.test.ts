import { enUS, ptBR } from "@clerk/localizations";
import {
	CLERK_APPEARANCE,
	CLERK_CONFIG,
	CLERK_SIGN_IN_APPEARANCE,
} from "@/lib/clerk/clerk-appearance";
import { getClerkLocalization } from "@/lib/clerk/clerk-localization";

describe("clerk appearance", () => {
	it("uses the Plei logo and terms page", () => {
		expect(CLERK_APPEARANCE.layout.logoImageUrl).toBe(CLERK_CONFIG.logoUrl);
		expect(CLERK_APPEARANCE.layout.termsPageUrl).toBe(CLERK_CONFIG.termsUrl);
	});

	it("hides the email/phone switcher on sign-in", () => {
		expect(CLERK_SIGN_IN_APPEARANCE.elements.formFieldAction).toEqual({ display: "none" });
	});
});

describe("getClerkLocalization", () => {
	it("maps app locales to Clerk localizations", () => {
		expect(getClerkLocalization("en")).toBe(enUS);
		expect(getClerkLocalization("pt-BR")).toBe(ptBR);
	});
});
