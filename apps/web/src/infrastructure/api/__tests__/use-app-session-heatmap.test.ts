import { renderHook, waitFor } from "@testing-library/react";
import { createQueryWrapper } from "@/infrastructure/api/test-utils";
import { useAppSessionHeatmap } from "@/infrastructure/api/use-app-session-heatmap";

describe("useAppSessionHeatmap", () => {
	afterEach(() => vi.unstubAllGlobals());

	it("fetches the app session heatmap", async () => {
		const fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			status: 200,
			json: async () => ({ data: [{ lat: 29.75, lng: -95.35, sessionWeight: 10 }] }),
		});
		vi.stubGlobal("fetch", fetchMock);
		const { Wrapper } = createQueryWrapper();

		const { result } = renderHook(() => useAppSessionHeatmap(), { wrapper: Wrapper });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data).toEqual([{ lat: 29.75, lng: -95.35, sessionWeight: 10 }]);
		expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/v1/app-session-heatmap");
	});
});
