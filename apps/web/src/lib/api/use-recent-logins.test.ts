import { renderHook, waitFor } from "@testing-library/react";
import { createQueryWrapper } from "@/lib/api/test-utils";
import { recentLoginsQueryKey, useRecentLogins } from "@/lib/api/use-recent-logins";

describe("useRecentLogins", () => {
	afterEach(() => vi.unstubAllGlobals());

	it("fetches recent logins with the requested limit", async () => {
		const fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			status: 200,
			json: async () => ({ data: [{ id: "1" }] }),
		});
		vi.stubGlobal("fetch", fetchMock);
		const { Wrapper } = createQueryWrapper();

		const { result } = renderHook(() => useRecentLogins(5), { wrapper: Wrapper });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data).toEqual([{ id: "1" }]);
		expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/v1/logins?limit=5");
	});

	it("builds a stable query key", () => {
		expect(recentLoginsQueryKey(5)).toEqual(["logins", "recent", 5]);
	});
});
