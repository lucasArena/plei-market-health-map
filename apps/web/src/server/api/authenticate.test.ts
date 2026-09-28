import { ForbiddenError, UnauthorizedError } from "@market-health-map/application";
import { requireUser } from "@/server/api/authenticate";

const mockAccess = vi.fn();

vi.mock("@/server/auth/internal-access", () => ({ getInternalAccess: () => mockAccess() }));

describe("requireUser", () => {
	it("returns the signed-in Plei principal", async () => {
		mockAccess.mockResolvedValue({
			status: "allowed",
			userId: "g-1",
			email: "lucas@plei.com",
			name: null,
			image: null,
		});
		await expect(requireUser()).resolves.toEqual({ userId: "g-1", email: "lucas@plei.com" });
	});

	it("rejects anonymous requests", async () => {
		mockAccess.mockResolvedValue({ status: "anonymous" });
		await expect(requireUser()).rejects.toBeInstanceOf(UnauthorizedError);
	});

	it("forbids accounts outside the Plei domain", async () => {
		mockAccess.mockResolvedValue({ status: "denied", email: "a@gmail.com" });
		await expect(requireUser()).rejects.toBeInstanceOf(ForbiddenError);
	});
});
