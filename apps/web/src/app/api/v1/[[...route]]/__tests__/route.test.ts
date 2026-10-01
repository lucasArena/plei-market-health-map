const mockAccess = vi.fn();
const mockFetch = vi.fn();
const captured = vi.hoisted(() => ({ options: null as null | { resolveAccess: () => unknown } }));

vi.mock("@market-health-map/server", () => ({
	createApiApp: (options: { resolveAccess: () => unknown }) => {
		captured.options = options;
		return { fetch: (request: Request) => mockFetch(request) };
	},
}));
vi.mock("@/infrastructure/auth/internal-access", () => ({ getInternalAccess: () => mockAccess() }));

describe("GET /api/v1/*", () => {
	it("hands the request to the server's API app", async () => {
		const { GET } = await import("@/app/api/v1/[[...route]]/route");
		const request = new Request("http://localhost/api/v1/facilities");
		mockFetch.mockReturnValue(new Response("ok", { status: 200 }));

		const response = await GET(request);

		expect(mockFetch).toHaveBeenCalledWith(request);
		expect(response.status).toBe(200);
	});

	it("hands POST requests, like feedback, to the server's API app", async () => {
		const { POST } = await import("@/app/api/v1/[[...route]]/route");
		const request = new Request("http://localhost/api/v1/feedback", { method: "POST" });
		mockFetch.mockReturnValue(new Response("{}", { status: 201 }));

		const response = await POST(request);

		expect(mockFetch).toHaveBeenCalledWith(request);
		expect(response.status).toBe(201);
	});

	it("hands PUT requests, like switching a feature flag, to the server's API app", async () => {
		const { PUT } = await import("@/app/api/v1/[[...route]]/route");
		const request = new Request("http://localhost/api/v1/feature-flags/new-panel", {
			method: "PUT",
		});
		mockFetch.mockReturnValue(new Response("{}", { status: 200 }));

		const response = await PUT(request);

		expect(mockFetch).toHaveBeenCalledWith(request);
		expect(response.status).toBe(200);
	});

	it("checks access with the Auth.js session", async () => {
		await import("@/app/api/v1/[[...route]]/route");
		mockAccess.mockResolvedValue({ status: "anonymous" });

		await expect(captured.options?.resolveAccess()).resolves.toEqual({ status: "anonymous" });
	});
});
