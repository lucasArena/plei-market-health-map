import { UnauthorizedError } from "@market-health-map/application";
import { requireUser } from "@/server/api/authenticate";

const mockAuth = vi.fn();

vi.mock("@clerk/nextjs/server", () => ({ auth: () => mockAuth() }));

describe("requireUser", () => {
	it("returns the signed-in principal", async () => {
		mockAuth.mockResolvedValue({ userId: "user_1", sessionId: "sess_1" });
		await expect(requireUser()).resolves.toEqual({ userId: "user_1", sessionId: "sess_1" });
	});

	it("rejects anonymous requests", async () => {
		mockAuth.mockResolvedValue({ userId: null, sessionId: null });
		await expect(requireUser()).rejects.toBeInstanceOf(UnauthorizedError);
	});
});
