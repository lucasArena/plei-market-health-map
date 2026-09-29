import { UnauthorizedError } from "@market-health-map/application";
import { GET } from "@/app/api/v1/app-session-heatmap/route";

const mockRequireUser = vi.fn();
const mockListAppSessionHeatmap = vi.fn();

vi.mock("@/server/api/authenticate", () => ({ requireUser: () => mockRequireUser() }));
vi.mock("@/server/container", () => ({
	getContainer: () => ({ listAppSessionHeatmap: mockListAppSessionHeatmap }),
}));

describe("GET /api/v1/app-session-heatmap", () => {
	beforeEach(() => vi.clearAllMocks());

	it("returns heatmap cells for a signed-in user", async () => {
		mockRequireUser.mockResolvedValue({ userId: "user_1", email: "lucas@plei.com" });
		mockListAppSessionHeatmap.mockResolvedValue([
			{ lat: 29.746, lng: -95.352, sessionWeight: 1134 },
		]);

		const response = await GET(new Request("http://localhost/api/v1/app-session-heatmap"));

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({
			data: [{ lat: 29.746, lng: -95.352, sessionWeight: 1134 }],
		});
	});

	it("rejects anonymous requests", async () => {
		mockRequireUser.mockRejectedValue(new UnauthorizedError());

		const response = await GET(new Request("http://localhost/api/v1/app-session-heatmap"));

		expect(response.status).toBe(401);
		expect(mockListAppSessionHeatmap).not.toHaveBeenCalled();
	});
});
