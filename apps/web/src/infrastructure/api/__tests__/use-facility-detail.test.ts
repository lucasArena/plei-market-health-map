import { renderHook, waitFor } from "@testing-library/react";
import { createQueryWrapper } from "@/infrastructure/api/test-utils";
import {
	facilityDetailQueryKey,
	useFacilityDetail,
} from "@/infrastructure/api/use-facility-detail";

describe("useFacilityDetail", () => {
	afterEach(() => vi.unstubAllGlobals());

	it("fetches the selected facility's detail", async () => {
		const fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			status: 200,
			json: async () => ({ data: { facility: { id: "889" }, stats: {} } }),
		});
		vi.stubGlobal("fetch", fetchMock);
		const { Wrapper } = createQueryWrapper();

		const { result } = renderHook(() => useFacilityDetail("889"), { wrapper: Wrapper });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/v1/facilities/889");
	});

	it("stays idle without a selection", () => {
		const fetchMock = vi.fn();
		vi.stubGlobal("fetch", fetchMock);
		const { Wrapper } = createQueryWrapper();

		const { result } = renderHook(() => useFacilityDetail(null), { wrapper: Wrapper });

		expect(result.current.fetchStatus).toBe("idle");
		expect(fetchMock).not.toHaveBeenCalled();
		expect(facilityDetailQueryKey(null)).toEqual(["facilities", "detail", null]);
	});
});
