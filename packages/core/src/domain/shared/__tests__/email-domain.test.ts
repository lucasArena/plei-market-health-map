import { hasEmailDomain } from "@core/domain/shared/email-domain";

describe("hasEmailDomain", () => {
	it("accepts addresses on the exact domain, ignoring case and spaces", () => {
		expect(hasEmailDomain("lucas@plei.com", "plei.com")).toBe(true);
		expect(hasEmailDomain("  Dev+Clerk_Test@PLEI.com ", " Plei.com")).toBe(true);
	});

	it.each([
		"someone@gmail.com",
		"someone@evilplei.com",
		"someone@plei.com.evil.io",
		"someone@sub.plei.com",
		"@plei.com",
		"plei.com",
		"",
	])("rejects %s", (email) => {
		expect(hasEmailDomain(email, "plei.com")).toBe(false);
	});
});
