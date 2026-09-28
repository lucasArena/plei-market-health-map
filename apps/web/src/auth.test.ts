const captured = vi.hoisted(() => ({ config: null as null | Record<string, never> }));
const mockGoogle = vi.fn((options: unknown) => ({ id: "google", options }));
const mockTrackSignIn = vi.fn();

vi.mock("next-auth", () => ({
	default: (config: Record<string, never>) => {
		captured.config = config;
		return {
			handlers: { GET: "get", POST: "post" },
			auth: vi.fn(),
			signIn: vi.fn(),
			signOut: vi.fn(),
		};
	},
}));
vi.mock("next-auth/providers/google", () => ({
	default: (options: unknown) => mockGoogle(options),
}));
vi.mock("@/env", () => ({ getAllowedEmailDomain: () => "plei.com" }));
vi.mock("@/server/auth/track-sign-in", () => ({
	trackSignIn: (identity: unknown) => mockTrackSignIn(identity),
}));

async function loadConfig() {
	await import("@/auth");
	if (!captured.config) throw new Error("NextAuth was not configured");
	return captured.config as unknown as {
		providers: unknown[];
		pages: Record<string, string>;
		session: { strategy: string };
		callbacks: { signIn: (input: { profile?: Record<string, unknown> }) => true | string };
		events: {
			signIn: (input: {
				user: Record<string, unknown>;
				profile?: Record<string, unknown>;
			}) => Promise<void>;
		};
	};
}

describe("auth config", () => {
	it("uses Google limited to the Plei domain with JWT sessions", async () => {
		const config = await loadConfig();

		expect(mockGoogle).toHaveBeenCalledWith({
			authorization: { params: { hd: "plei.com", prompt: "select_account" } },
		});
		expect(config.pages).toEqual({ signIn: "/sign-in", error: "/sign-in" });
		expect(config.session.strategy).toBe("jwt");
	});

	it("lets Plei accounts in and bounces everyone else with feedback", async () => {
		const { callbacks } = await loadConfig();

		expect(callbacks.signIn({ profile: { email: "lucas@plei.com", email_verified: true } })).toBe(
			true,
		);
		expect(callbacks.signIn({ profile: { email: "a@gmail.com", email_verified: true } })).toBe(
			"/sign-in?error=domain&email=a%40gmail.com",
		);
		expect(callbacks.signIn({})).toBe("/sign-in?error=missing-email");
	});

	it("records each successful sign-in", async () => {
		const { events } = await loadConfig();

		await events.signIn({ user: { id: "u-1", email: "lucas@plei.com" }, profile: { sub: "g-1" } });
		await events.signIn({ user: { id: "u-2", email: "lucas@plei.com" } });
		await events.signIn({ user: {} });

		expect(mockTrackSignIn.mock.calls.map(([identity]) => identity)).toEqual([
			{ userId: "g-1", email: "lucas@plei.com" },
			{ userId: "u-2", email: "lucas@plei.com" },
			{ userId: null, email: null },
		]);
	});
});
