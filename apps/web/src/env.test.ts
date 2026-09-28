import { getServerEnv, resetServerEnvCache } from "@/env";

const VALID = {
	DATABASE_URL: "postgresql://app:app@localhost:5432/app",
	CLERK_SECRET_KEY: "sk_test_x",
	NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_x",
};

describe("getServerEnv", () => {
	afterEach(() => {
		vi.unstubAllEnvs();
		resetServerEnvCache();
	});

	it("parses and caches a valid environment", () => {
		for (const [key, value] of Object.entries(VALID)) vi.stubEnv(key, value);

		const env = getServerEnv();

		expect(env).toMatchObject(VALID);
		expect(getServerEnv()).toBe(env);
	});

	it("fails fast when a variable is missing", () => {
		vi.stubEnv("DATABASE_URL", "");
		expect(() => getServerEnv()).toThrow();
	});
});
