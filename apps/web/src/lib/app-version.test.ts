import { getAppVersion } from "@/lib/app-version";

describe("getAppVersion", () => {
	afterEach(() => vi.unstubAllEnvs());

	it("reads the version baked in at build time", () => {
		vi.stubEnv("NEXT_PUBLIC_APP_VERSION", "0.3.1");
		expect(getAppVersion()).toBe("0.3.1");
	});

	it("falls back when no version was provided", () => {
		vi.stubEnv("NEXT_PUBLIC_APP_VERSION", "");
		expect(getAppVersion()).toBe("dev");
	});
});
