import { renderHook, waitFor } from "@testing-library/react";
import { createQueryWrapper } from "@/application/test/query-wrapper";
import { statsDayKey, withStatsTimeZone } from "@/infrastructure/time/stats-day";
import {
	facilityQualityQueryKey,
	useFacilityQuality,
} from "@/presentation/hooks/use-facility/use-facility-quality";

describe("useFacilityQuality", () => {
	afterEach(() => vi.unstubAllGlobals());

	it("fetches demand and satisfaction for one facility", async () => {
		const fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			status: 200,
			json: async () => ({ data: { periods: {}, lowReviews: [] } }),
		});
		vi.stubGlobal("fetch", fetchMock);
		const { Wrapper } = createQueryWrapper();

		const { result } = renderHook(() => useFacilityQuality("889"), { wrapper: Wrapper });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(fetchMock.mock.calls[0]?.[0]).toBe(withStatsTimeZone("/api/v1/facilities/889/quality"));
		expect(facilityQualityQueryKey("889")).toEqual([
			"facilities",
			"detail",
			"889",
			"quality",
			statsDayKey(),
		]);
	});

	it("waits without a facility or while disabled", () => {
		const fetchMock = vi.fn();
		vi.stubGlobal("fetch", fetchMock);
		const { Wrapper } = createQueryWrapper();

		renderHook(() => useFacilityQuality(null), { wrapper: Wrapper });
		renderHook(() => useFacilityQuality("889", false), { wrapper: Wrapper });

		expect(fetchMock).not.toHaveBeenCalled();
	});
});
