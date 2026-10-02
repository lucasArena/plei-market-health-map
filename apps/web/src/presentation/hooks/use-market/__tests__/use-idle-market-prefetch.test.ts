import { renderHook } from "@testing-library/react";
import { createQueryWrapper } from "@/application/test/query-wrapper";
import { useIdleMarketPrefetch } from "@/presentation/hooks/use-market/use-idle-market-prefetch";

const mockPrefetch = vi.fn();
const mockFacilities = vi.fn();
const mockCanPrefetch = vi.fn();
const idleCallbacks: Array<() => void> = [];
const mockCancelIdle = vi.fn();

vi.mock("@/presentation/hooks/use-market/prefetch-market-summary", () => ({
	prefetchMarketSummary: (...args: unknown[]) => mockPrefetch(...args),
}));
vi.mock("@/presentation/hooks/use-facility/use-facility-list-all", () => ({
	useFacilityListAll: () => mockFacilities(),
}));
vi.mock("@/infrastructure/prefetch/prefetch-policy", () => ({
	canPrefetchInBackground: () => mockCanPrefetch(),
	whenIdle: (callback: () => void) => {
		idleCallbacks.push(callback);
		return mockCancelIdle;
	},
}));

describe("useIdleMarketPrefetch", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		idleCallbacks.length = 0;
		mockPrefetch.mockResolvedValue(undefined);
		mockCanPrefetch.mockReturnValue(true);
		mockFacilities.mockReturnValue({ isSuccess: true });
	});

	it("loads All markets in an idle moment once the map has its facilities", () => {
		const { Wrapper, client } = createQueryWrapper();
		const { unmount } = renderHook(() => useIdleMarketPrefetch(true), { wrapper: Wrapper });

		expect(mockPrefetch).not.toHaveBeenCalled();
		idleCallbacks[0]?.();
		expect(mockPrefetch).toHaveBeenCalledWith(client, null);
		unmount();
		expect(mockCancelIdle).toHaveBeenCalled();
	});

	it("waits while the map loads, off the map, and on slow or data-saving connections", () => {
		const { Wrapper } = createQueryWrapper();
		mockFacilities.mockReturnValue({ isSuccess: false });
		renderHook(() => useIdleMarketPrefetch(true), { wrapper: Wrapper });
		mockFacilities.mockReturnValue({ isSuccess: true });
		renderHook(() => useIdleMarketPrefetch(false), { wrapper: Wrapper });
		mockCanPrefetch.mockReturnValue(false);
		renderHook(() => useIdleMarketPrefetch(true), { wrapper: Wrapper });

		expect(idleCallbacks).toHaveLength(0);
	});

	it("ignores a failed prefetch", async () => {
		mockPrefetch.mockRejectedValue(new Error("down"));
		const { Wrapper } = createQueryWrapper();
		const { result } = renderHook(() => useIdleMarketPrefetch(true), { wrapper: Wrapper });

		expect(() => result.current.prefetchAllMarkets()).not.toThrow();
		await Promise.resolve();
	});
});
