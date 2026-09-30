import {
	getAiGatewayApiKey,
	getAllowedEmailDomain,
	getFeedbackMode,
	getLinearCredentials,
	getServerEnv,
	hasPartialLinearAppCredentials,
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
		vi.stubEnv("LINEAR_CLIENT_ID", "");
		vi.stubEnv("LINEAR_CLIENT_SECRET", "");
		vi.stubEnv("LINEAR_API_KEY", "");
		vi.stubEnv("FEEDBACK_DRY_RUN", "");
		expect(getFeedbackMode()).toBe("unconfigured");
		expect(getLinearCredentials()).toBeNull();
	});

	it("falls back to the personal key without app credentials", () => {
		vi.stubEnv("LINEAR_CLIENT_ID", "");
		vi.stubEnv("LINEAR_CLIENT_SECRET", "");
		vi.stubEnv("LINEAR_API_KEY", "lin_api_test");
		vi.stubEnv("FEEDBACK_DRY_RUN", "false");
		expect(getFeedbackMode()).toBe("linear-api-key");
		expect(getLinearCredentials()).toEqual({ kind: "api-key", apiKey: "lin_api_test" });
	});

	it("prefers the Linear app credentials over the personal key", () => {
		vi.stubEnv("LINEAR_CLIENT_ID", " client-id ");
		vi.stubEnv("LINEAR_CLIENT_SECRET", "client-secret");
		vi.stubEnv("LINEAR_API_KEY", "lin_api_test");
		vi.stubEnv("FEEDBACK_DRY_RUN", "");
		expect(getFeedbackMode()).toBe("linear-app");
		expect(getLinearCredentials()).toEqual({
			kind: "app",
			clientId: "client-id",
			clientSecret: "client-secret",
		});
		expect(hasPartialLinearAppCredentials()).toBe(false);
	});

	it("ignores half-configured app credentials", () => {
		vi.stubEnv("LINEAR_CLIENT_ID", "client-id");
		vi.stubEnv("LINEAR_CLIENT_SECRET", "");
		vi.stubEnv("LINEAR_API_KEY", "lin_api_test");
		vi.stubEnv("FEEDBACK_DRY_RUN", "");
		expect(hasPartialLinearAppCredentials()).toBe(true);
		expect(getFeedbackMode()).toBe("linear-api-key");
	});

	it("prefers dry-run over a real key", () => {
		vi.stubEnv("LINEAR_CLIENT_ID", "client-id");
		vi.stubEnv("LINEAR_CLIENT_SECRET", "client-secret");
		vi.stubEnv("LINEAR_API_KEY", "lin_api_test");
		vi.stubEnv("FEEDBACK_DRY_RUN", "true");
		expect(getFeedbackMode()).toBe("dry-run");
		resetServerEnvCache();
		vi.stubEnv("LINEAR_CLIENT_ID", "");
		vi.stubEnv("LINEAR_CLIENT_SECRET", "");
		vi.stubEnv("LINEAR_API_KEY", "");
		expect(getFeedbackMode()).toBe("dry-run");
	});

	it("fails fast on an unreadable dry-run flag", () => {
		vi.stubEnv("FEEDBACK_DRY_RUN", "maybe");
		expect(() => getServerEnv()).toThrow();
	});

	it("reads the optional AI Gateway key for feedback titles", () => {
		vi.stubEnv("AI_GATEWAY_API_KEY", "");
		expect(getAiGatewayApiKey()).toBeUndefined();
		resetServerEnvCache();
		vi.stubEnv("AI_GATEWAY_API_KEY", " gw-key ");
		expect(getAiGatewayApiKey()).toBe("gw-key");
	});
});
