import {
	getAllowedEmailDomain,
	getFeedbackMode,
	getServerEnv,
	isLoginTrackingConfigured,
	resetServerEnvCache,
} from "@server/env";

describe("server env", () => {
	afterEach(() => {
		vi.unstubAllEnvs();
		resetServerEnvCache();
	});

	it("parses and caches a valid environment", () => {
		vi.stubEnv("DATABASE_URL", "postgresql://app:app@localhost:5432/app");

		const env = getServerEnv();

		expect(env.DATABASE_URL).toBe("postgresql://app:app@localhost:5432/app");
		expect(getServerEnv()).toBe(env);
		expect(isLoginTrackingConfigured()).toBe(true);
	});

	it("treats a missing or empty database url as tracking disabled", () => {
		vi.stubEnv("DATABASE_URL", "");
		expect(isLoginTrackingConfigured()).toBe(false);
	});

	it("fails fast on a malformed database url", () => {
		vi.stubEnv("DATABASE_URL", "not-a-url");
		expect(() => getServerEnv()).toThrow();
	});

	it("accepts an optional warehouse url", () => {
		vi.stubEnv("DATA_WAREHOUSE_URL", "postgresql://reader:secret@warehouse:5432/dataplei");
		expect(getServerEnv().DATA_WAREHOUSE_URL).toBe(
			"postgresql://reader:secret@warehouse:5432/dataplei",
		);
		resetServerEnvCache();
		vi.stubEnv("DATA_WAREHOUSE_URL", "");
		expect(getServerEnv().DATA_WAREHOUSE_URL).toBeUndefined();
	});

	it("allows plei.com by default and can be overridden", () => {
		vi.stubEnv("ALLOWED_EMAIL_DOMAIN", "");
		expect(getAllowedEmailDomain()).toBe("plei.com");
		resetServerEnvCache();
		vi.stubEnv("ALLOWED_EMAIL_DOMAIN", " example.org ");
		expect(getAllowedEmailDomain()).toBe("example.org");
	});

	it("leaves feedback unconfigured without a Linear key", () => {
		vi.stubEnv("LINEAR_API_KEY", "");
		vi.stubEnv("FEEDBACK_DRY_RUN", "");
		expect(getFeedbackMode()).toBe("unconfigured");
	});

	it("sends feedback to Linear when the key is set", () => {
		vi.stubEnv("LINEAR_API_KEY", "lin_api_test");
		vi.stubEnv("FEEDBACK_DRY_RUN", "false");
		expect(getFeedbackMode()).toBe("linear");
		expect(getServerEnv().LINEAR_API_KEY).toBe("lin_api_test");
	});

	it("prefers dry-run over a real key", () => {
		vi.stubEnv("LINEAR_API_KEY", "lin_api_test");
		vi.stubEnv("FEEDBACK_DRY_RUN", "true");
		expect(getFeedbackMode()).toBe("dry-run");
		resetServerEnvCache();
		vi.stubEnv("LINEAR_API_KEY", "");
		expect(getFeedbackMode()).toBe("dry-run");
	});

	it("fails fast on an unreadable dry-run flag", () => {
		vi.stubEnv("FEEDBACK_DRY_RUN", "maybe");
		expect(() => getServerEnv()).toThrow();
	});
});
