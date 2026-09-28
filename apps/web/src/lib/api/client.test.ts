import { ApiError, apiClient } from "@/lib/api/client";

function stubFetch(status: number, body: unknown) {
	const fetchMock = vi.fn().mockResolvedValue({
		ok: status < 400,
		status,
		json: async () => {
			if (body instanceof Error) throw body;
			return body;
		},
	});
	vi.stubGlobal("fetch", fetchMock);
	return fetchMock;
}

describe("apiClient", () => {
	afterEach(() => vi.unstubAllGlobals());

	it("unwraps the data envelope", async () => {
		const fetchMock = stubFetch(200, { data: [1, 2] });

		await expect(apiClient.get("/api/v1/logins")).resolves.toEqual([1, 2]);
		expect(fetchMock).toHaveBeenCalledWith(
			"/api/v1/logins",
			expect.objectContaining({ credentials: "include" }),
		);
	});

	it("throws an ApiError with the server payload", async () => {
		stubFetch(401, { error: { code: "UNAUTHORIZED", message: "Sign in." } });

		await expect(apiClient.get("/x")).rejects.toMatchObject({
			name: "ApiError",
			code: "UNAUTHORIZED",
			status: 401,
			message: "Sign in.",
		});
	});

	it("falls back to a generic error for unreadable bodies", async () => {
		stubFetch(500, new Error("not json"));

		const error = await apiClient.get("/x").catch((caught: unknown) => caught);

		expect(error).toBeInstanceOf(ApiError);
		expect(error).toMatchObject({ code: "UNKNOWN_ERROR", status: 500 });
	});
});
