import { getInternalAccess } from "@/infrastructure/auth/internal-access";

const mockAuth = vi.fn();

vi.mock("@/infrastructure/auth/auth", () => ({ auth: () => mockAuth() }));
vi.mock("@market-health-map/server", () => ({
	getAllowedEmailDomain: () => "plei.com",
	isAdmin: (email: string) => email === "lucas@plei.com",
}));

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
			isAdmin: true,
		});
	});

	it("falls back to the email when the session has no id, name or image", async () => {
		mockAuth.mockResolvedValue({ user: { email: "alan@plei.com" } });
		await expect(getInternalAccess()).resolves.toMatchObject({
			userId: "alan@plei.com",
			name: null,
			image: null,
			isAdmin: false,
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
