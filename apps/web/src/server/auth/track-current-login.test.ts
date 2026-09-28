import { trackCurrentLogin } from "@/server/auth/track-current-login";

const mockAuth = vi.fn();
const mockCurrentUser = vi.fn();
const mockRecordLogin = vi.fn();

vi.mock("@clerk/nextjs/server", () => ({
	auth: () => mockAuth(),
	currentUser: () => mockCurrentUser(),
}));

vi.mock("@/server/container", () => ({
	getContainer: () => ({ recordLogin: mockRecordLogin }),
}));

const VIEW = {
	id: "1",
	userId: "user_1",
	email: "dev@plei.com",
	signedInAt: "2026-09-28T10:00:00.000Z",
};

describe("trackCurrentLogin", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockAuth.mockResolvedValue({ userId: "user_1", sessionId: "sess_1" });
		mockCurrentUser.mockResolvedValue({ primaryEmailAddress: { emailAddress: "dev@plei.com" } });
	});

	it("records the current session login", async () => {
		mockRecordLogin.mockResolvedValue(VIEW);

		await expect(trackCurrentLogin()).resolves.toEqual(VIEW);
		expect(mockRecordLogin).toHaveBeenCalledWith({
			userId: "user_1",
			sessionId: "sess_1",
			email: "dev@plei.com",
		});
	});

	it("skips anonymous visitors", async () => {
		mockAuth.mockResolvedValue({ userId: null, sessionId: null });

		await expect(trackCurrentLogin()).resolves.toBeNull();
		expect(mockRecordLogin).not.toHaveBeenCalled();
	});

	it("skips users without a primary email", async () => {
		mockCurrentUser.mockResolvedValue(null);

		await expect(trackCurrentLogin()).resolves.toBeNull();
		expect(mockRecordLogin).not.toHaveBeenCalled();
	});

	it("never breaks the page when recording fails", async () => {
		const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
		mockRecordLogin.mockRejectedValueOnce(new Error("db down"));
		await expect(trackCurrentLogin()).resolves.toBeNull();
		mockRecordLogin.mockRejectedValueOnce("raw");
		await expect(trackCurrentLogin()).resolves.toBeNull();
		expect(spy).toHaveBeenCalledWith("[track-login]", "raw");
		spy.mockRestore();
	});
});
