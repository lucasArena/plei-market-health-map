import { UnauthorizedError } from "@market-health-map/application";
import { GET } from "@/app/api/v1/markets/route";

const mockRequireUser = vi.fn();
const mockListMarketHealth = vi.fn();

vi.mock("@/server/api/authenticate", () => ({ requireUser: () => mockRequireUser() }));
vi.mock("@/server/container", () => ({
	getContainer: () => ({ listMarketHealth: mockListMarketHealth }),
}));

describe("GET /api/v1/markets", () => {
	beforeEach(() => vi.clearAllMocks());

	it("returns market health for a signed-in user", async () => {
		mockRequireUser.mockResolvedValue({ userId: "user_1", sessionId: "sess_1" });
		mockListMarketHealth.mockResolvedValue([{ id: "austin" }]);

		const response = await GET(new Request("http://localhost/api/v1/markets"));

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ data: [{ id: "austin" }] });
	});

	it("rejects anonymous requests", async () => {
		mockRequireUser.mockRejectedValue(new UnauthorizedError());

		const response = await GET(new Request("http://localhost/api/v1/markets"));

		expect(response.status).toBe(401);
		expect(mockListMarketHealth).not.toHaveBeenCalled();
	});
});
