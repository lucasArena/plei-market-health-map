import { evaluateSignIn, signInErrorUrl } from "@/infrastructure/auth/sign-in-policy";

const DOMAIN = "plei.com";

describe("evaluateSignIn", () => {
	it("lets verified @plei.com accounts through", () => {
		expect(evaluateSignIn({ email: "lucas@plei.com", emailVerified: true, domain: DOMAIN })).toBe(
			true,
		);
	});

	it("blocks other domains and explains why", () => {
		expect(
			evaluateSignIn({ email: "someone@gmail.com", emailVerified: true, domain: DOMAIN }),
		).toBe("/sign-in?error=domain&email=someone%40gmail.com");
	});

	it("blocks unverified emails even on the Plei domain", () => {
		expect(evaluateSignIn({ email: "lucas@plei.com", emailVerified: false, domain: DOMAIN })).toBe(
			"/sign-in?error=domain&email=lucas%40plei.com",
		);
	});

	it("blocks accounts without an email", () => {
		expect(evaluateSignIn({ email: null, emailVerified: true, domain: DOMAIN })).toBe(
			"/sign-in?error=missing-email",
		);
	});
});

describe("signInErrorUrl", () => {
	it("builds the sign-in URL with the error only", () => {
		expect(signInErrorUrl("domain")).toBe("/sign-in?error=domain");
	});
});
