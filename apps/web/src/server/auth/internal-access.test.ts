import { getInternalAccess } from "@/server/auth/internal-access";

const mockAuth = vi.fn();

vi.mock("@/auth", () => ({ auth: () => mockAuth() }));
vi.mock("@/env", () => ({ getAllowedEmailDomain: () => "plei.com" }));

describe("getInternalAccess", () => {
	it("is anonymous without a session or email", async () => {
		mockAuth.mockResolvedValue(null);
		await expect(getInternalAccess()).resolves.toEqual({ status: "anonymous" });
		mockAuth.mockResolvedValue({ user: {} });
		await expect(getInternalAccess()).resolves.toEqual({ status: "anonymous" });
	});

	it("allows @plei.com sessions", async () => {
		mockAuth.mockResolvedValue({
			user: { id: "g-1", email: "lucas@plei.com", name: "Lucas", image: "https://img/l.png" },
		});
		await expect(getInternalAccess()).resolves.toEqual({
			status: "allowed",
			userId: "g-1",
			email: "lucas@plei.com",
			name: "Lucas",
			image: "https://img/l.png",
		});
	});

	it("falls back to the email when the session has no id, name or image", async () => {
		mockAuth.mockResolvedValue({ user: { email: "lucas@plei.com" } });
		await expect(getInternalAccess()).resolves.toMatchObject({
			userId: "lucas@plei.com",
			name: null,
			image: null,
		});
	});

	it("denies sessions from other domains", async () => {
		mockAuth.mockResolvedValue({ user: { email: "someone@gmail.com" } });
		await expect(getInternalAccess()).resolves.toEqual({
			status: "denied",
			email: "someone@gmail.com",
		});
	});
});
