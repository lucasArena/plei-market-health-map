import { renderHook, waitFor } from "@testing-library/react";
import { createQueryWrapper } from "@/lib/api/test-utils";
import { useMarketHealth } from "@/lib/api/use-market-health";

describe("useMarketHealth", () => {
	afterEach(() => vi.unstubAllGlobals());

	it("fetches market health", async () => {
		const fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			status: 200,
			json: async () => ({ data: [{ id: "austin" }] }),
		});
		vi.stubGlobal("fetch", fetchMock);
		const { Wrapper } = createQueryWrapper();

		const { result } = renderHook(() => useMarketHealth(), { wrapper: Wrapper });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data).toEqual([{ id: "austin" }]);
		expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/v1/markets");
	});
});
