import { UnauthorizedError } from "@market-health-map/application";
import { GET } from "@/app/api/v1/facilities/route";

const mockRequireUser = vi.fn();
const mockListFacilities = vi.fn();

vi.mock("@/server/api/authenticate", () => ({ requireUser: () => mockRequireUser() }));
vi.mock("@/server/container", () => ({
	getContainer: () => ({ listFacilities: mockListFacilities }),
}));

describe("GET /api/v1/facilities", () => {
	beforeEach(() => vi.clearAllMocks());

	it("returns facilities for a signed-in user", async () => {
		mockRequireUser.mockResolvedValue({ userId: "user_1", sessionId: "sess_1" });
		mockListFacilities.mockResolvedValue([{ id: "f1" }]);

		const response = await GET(new Request("http://localhost/api/v1/facilities"));

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ data: [{ id: "f1" }] });
	});

	it("rejects anonymous requests", async () => {
		mockRequireUser.mockRejectedValue(new UnauthorizedError());

		const response = await GET(new Request("http://localhost/api/v1/facilities"));

		expect(response.status).toBe(401);
		expect(mockListFacilities).not.toHaveBeenCalled();
	});
});
