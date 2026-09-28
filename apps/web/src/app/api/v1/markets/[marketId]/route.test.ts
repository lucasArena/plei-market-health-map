import { NotFoundError, UnauthorizedError } from "@market-health-map/application";
import { GET } from "@/app/api/v1/markets/[marketId]/route";

const mockRequireUser = vi.fn();
const mockGetMarketDetail = vi.fn();

vi.mock("@/server/api/authenticate", () => ({ requireUser: () => mockRequireUser() }));
vi.mock("@/server/container", () => ({
	getContainer: () => ({ getMarketDetail: mockGetMarketDetail }),
}));

function call(marketId: string) {
	return GET(new Request(`http://localhost/api/v1/markets/${marketId}`), {
		params: Promise.resolve({ marketId }),
	});
}

describe("GET /api/v1/markets/[marketId]", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockRequireUser.mockResolvedValue({ userId: "user_1", sessionId: "sess_1" });
	});

	it("returns the market detail", async () => {
		mockGetMarketDetail.mockResolvedValue({ market: { id: "austin" }, facilities: [] });

		const response = await call("austin");

		expect(response.status).toBe(200);
		expect(mockGetMarketDetail).toHaveBeenCalledWith({ marketId: "austin" });
		expect((await response.json()).data.market.id).toBe("austin");
	});

	it("returns 404 for an unknown market", async () => {
		mockGetMarketDetail.mockRejectedValue(new NotFoundError("Market"));
		expect((await call("nowhere")).status).toBe(404);
	});

	it("rejects anonymous requests", async () => {
		mockRequireUser.mockRejectedValue(new UnauthorizedError());
		expect((await call("austin")).status).toBe(401);
		expect(mockGetMarketDetail).not.toHaveBeenCalled();
	});
});
