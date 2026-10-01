import { renderHook, waitFor } from "@testing-library/react";
import { createQueryWrapper } from "@/application/test/query-wrapper";
import { useRegistrationHeatmap } from "@/presentation/hooks/use-app/use-registration-heatmap";

describe("useRegistrationHeatmap", () => {
	afterEach(() => vi.unstubAllGlobals());

	it("fetches the registration heatmap", async () => {
		const fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			status: 200,
			json: async () => ({ data: [{ lat: 29.75, lng: -95.35, registrationWeight: 10 }] }),
		});
		vi.stubGlobal("fetch", fetchMock);
		const { Wrapper } = createQueryWrapper();

		const { result } = renderHook(() => useRegistrationHeatmap(), { wrapper: Wrapper });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data).toEqual([{ lat: 29.75, lng: -95.35, registrationWeight: 10 }]);
		expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/v1/registration-heatmap");
	});
});
