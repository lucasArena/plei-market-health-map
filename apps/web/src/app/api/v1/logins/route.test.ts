import { UnauthorizedError } from "@market-health-map/application";
import { GET } from "@/app/api/v1/logins/route";

const mockRequireUser = vi.fn();
const mockListRecentLogins = vi.fn();

vi.mock("@/server/api/authenticate", () => ({ requireUser: () => mockRequireUser() }));
vi.mock("@/server/container", () => ({
	getContainer: () => ({ listRecentLogins: mockListRecentLogins }),
}));

describe("GET /api/v1/logins", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockRequireUser.mockResolvedValue({ userId: "user_1", email: "lucas@plei.com" });
	});

	it("returns recent logins for a signed-in user", async () => {
		mockListRecentLogins.mockResolvedValue([{ id: "1" }]);

		const response = await GET(new Request("http://localhost/api/v1/logins?limit=5"));

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ data: [{ id: "1" }] });
		expect(mockListRecentLogins).toHaveBeenCalledWith({ limit: "5" });
	});

	it("uses the default limit when none is given", async () => {
		mockListRecentLogins.mockResolvedValue([]);

		await GET(new Request("http://localhost/api/v1/logins"));

		expect(mockListRecentLogins).toHaveBeenCalledWith({ limit: undefined });
	});

	it("returns a localized 401 for anonymous requests", async () => {
		mockRequireUser.mockRejectedValue(new UnauthorizedError());

		const response = await GET(
			new Request("http://localhost/api/v1/logins", { headers: { "accept-language": "pt-BR" } }),
		);

		expect(response.status).toBe(401);
		expect((await response.json()).error.message).toBe("Você precisa entrar para continuar.");
	});
});
