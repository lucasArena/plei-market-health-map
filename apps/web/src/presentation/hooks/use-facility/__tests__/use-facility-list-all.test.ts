import { renderHook, waitFor } from "@testing-library/react";
import { createQueryWrapper } from "@/application/test/query-wrapper";
import { withStatsTimeZone } from "@/infrastructure/time/stats-day";
import { useFacilityListAll } from "@/presentation/hooks/use-facility/use-facility-list-all";

describe("useFacilityListAll", () => {
	afterEach(() => vi.unstubAllGlobals());

	it("fetches the facilities", async () => {
		const fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			status: 200,
			json: async () => ({ data: [{ id: "f1" }] }),
		});
		vi.stubGlobal("fetch", fetchMock);
		const { Wrapper } = createQueryWrapper();

		const { result } = renderHook(() => useFacilityListAll(), { wrapper: Wrapper });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data).toEqual([{ id: "f1" }]);
		expect(fetchMock.mock.calls[0]?.[0]).toBe(withStatsTimeZone("/api/v1/facilities"));
	});
});
