import { ForbiddenError, UnauthorizedError } from "@market-health-map/core/application";
import { requireUser } from "@server/presentation/http/authenticate";

const REQUEST = new Request("http://localhost/api/v1/facilities");

describe("requireUser", () => {
	it("returns the signed-in Plei principal", async () => {
		const resolveAccess = vi.fn().mockResolvedValue({
			status: "allowed",
			userId: "g-1",
			email: "lucas@plei.com",
		});
		await expect(requireUser(resolveAccess, REQUEST)).resolves.toEqual({
			userId: "g-1",
			email: "lucas@plei.com",
		});
		expect(resolveAccess).toHaveBeenCalledWith(REQUEST);
	});

	it("rejects anonymous requests", async () => {
		const resolveAccess = vi.fn().mockResolvedValue({ status: "anonymous" });
		await expect(requireUser(resolveAccess, REQUEST)).rejects.toBeInstanceOf(UnauthorizedError);
	});

	it("forbids accounts outside the Plei domain", async () => {
		const resolveAccess = vi.fn().mockResolvedValue({ status: "denied", email: "a@gmail.com" });
		await expect(requireUser(resolveAccess, REQUEST)).rejects.toBeInstanceOf(ForbiddenError);
	});
});
