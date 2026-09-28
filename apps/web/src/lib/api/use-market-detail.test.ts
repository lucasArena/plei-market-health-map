import { renderHook, waitFor } from "@testing-library/react";
import { createQueryWrapper } from "@/lib/api/test-utils";
import { marketDetailQueryKey, useMarketDetail } from "@/lib/api/use-market-detail";

describe("useMarketDetail", () => {
	afterEach(() => vi.unstubAllGlobals());

	it("fetches the detail of the selected market", async () => {
		const fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			status: 200,
			json: async () => ({ data: { market: { id: "sample-austin" }, facilities: [] } }),
		});
		vi.stubGlobal("fetch", fetchMock);
		const { Wrapper } = createQueryWrapper();

		const { result } = renderHook(() => useMarketDetail("sample-austin"), { wrapper: Wrapper });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/v1/markets/sample-austin");
	});

	it("stays idle without a selected market", () => {
		const fetchMock = vi.fn();
		vi.stubGlobal("fetch", fetchMock);
		const { Wrapper } = createQueryWrapper();

		const { result } = renderHook(() => useMarketDetail(null), { wrapper: Wrapper });

		expect(result.current.fetchStatus).toBe("idle");
		expect(fetchMock).not.toHaveBeenCalled();
		expect(marketDetailQueryKey(null)).toEqual(["markets", "detail", null]);
	});
});
