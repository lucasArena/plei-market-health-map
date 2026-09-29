const mockRecordLogin = vi.fn();
const mockIsConfigured = vi.fn();

vi.mock("@server/env", () => ({ isLoginTrackingConfigured: () => mockIsConfigured() }));

vi.mock("@server/container", () => ({
	getContainer: () => ({ recordLogin: mockRecordLogin }),
}));

const IDENTITY = { userId: "google-123", email: "lucas@plei.com" };

async function loadTracker() {
	vi.resetModules();
	return (await import("@server/presentation/auth/track-sign-in")).trackSignIn;
}

describe("trackSignIn", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockIsConfigured.mockReturnValue(true);
	});

	it("records each sign-in with its own id", async () => {
		const trackSignIn = await loadTracker();
		mockRecordLogin.mockResolvedValue({ id: "1" });

		await expect(trackSignIn(IDENTITY)).resolves.toEqual({ id: "1" });
		await trackSignIn(IDENTITY);

		const [first, second] = mockRecordLogin.mock.calls.map(([input]) => input);
		expect(first).toMatchObject({ userId: "google-123", email: "lucas@plei.com" });
		expect(first.sessionId).not.toBe(second.sessionId);
	});

	it("skips identities without a user id or email", async () => {
		const trackSignIn = await loadTracker();

		await expect(trackSignIn({ userId: null, email: "a@plei.com" })).resolves.toBeNull();
		await expect(trackSignIn({ userId: "u", email: null })).resolves.toBeNull();
		expect(mockRecordLogin).not.toHaveBeenCalled();
	});

	it("skips quietly, warning once, when no database is configured", async () => {
		const trackSignIn = await loadTracker();
		const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
		mockIsConfigured.mockReturnValue(false);

		await expect(trackSignIn(IDENTITY)).resolves.toBeNull();
		await expect(trackSignIn(IDENTITY)).resolves.toBeNull();

		expect(warn).toHaveBeenCalledTimes(1);
		expect(mockRecordLogin).not.toHaveBeenCalled();
		warn.mockRestore();
	});

	it("never breaks sign-in when recording fails", async () => {
		const trackSignIn = await loadTracker();
		const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
		mockRecordLogin.mockRejectedValueOnce(new Error("db down"));
		await expect(trackSignIn(IDENTITY)).resolves.toBeNull();
		mockRecordLogin.mockRejectedValueOnce("raw");
		await expect(trackSignIn(IDENTITY)).resolves.toBeNull();
		expect(spy).toHaveBeenCalledWith("[track-login]", "raw");
		spy.mockRestore();
	});
});
