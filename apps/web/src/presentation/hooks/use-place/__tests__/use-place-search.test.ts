import { renderHook, waitFor } from "@testing-library/react";
import { createQueryWrapper } from "@/application/test/query-wrapper";
import { placeSearchPath, usePlaceSearch } from "@/presentation/hooks/use-place/use-place-search";

describe("usePlaceSearch", () => {
	afterEach(() => vi.unstubAllGlobals());

	it("looks up places once per normalized query", async () => {
		const fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			status: 200,
			json: async () => ({ data: [{ id: "R1", name: "Wichita" }] }),
		});
		vi.stubGlobal("fetch", fetchMock);
		const { Wrapper } = createQueryWrapper();

		const first = renderHook(() => usePlaceSearch(" Wichita "), { wrapper: Wrapper });
		await waitFor(() => expect(first.result.current.data).toEqual([{ id: "R1", name: "Wichita" }]));
		renderHook(() => usePlaceSearch("wichita"), { wrapper: Wrapper });

		expect(fetchMock).toHaveBeenCalledOnce();
		expect(fetchMock.mock.calls[0]?.[0]).toBe(placeSearchPath("wichita"));
		expect(placeSearchPath("são paulo")).toBe("/api/v1/places?q=s%C3%A3o+paulo");
	});

	it("waits for at least two characters", () => {
		const fetchMock = vi.fn();
		vi.stubGlobal("fetch", fetchMock);
		const { Wrapper } = createQueryWrapper();

		renderHook(() => usePlaceSearch(" w "), { wrapper: Wrapper });

		expect(fetchMock).not.toHaveBeenCalled();
	});
});
