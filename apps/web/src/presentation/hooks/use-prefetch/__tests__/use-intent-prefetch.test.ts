import { act, renderHook } from "@testing-library/react";
import {
	INTENT_DELAY_MS,
	useIntentPrefetch,
} from "@/presentation/hooks/use-prefetch/use-intent-prefetch";

describe("useIntentPrefetch", () => {
	beforeEach(() => vi.useFakeTimers());
	afterEach(() => vi.useRealTimers());

	it("prefetches only after resting for the intent delay", () => {
		const { result } = renderHook(() => useIntentPrefetch());
		const prefetch = vi.fn();

		act(() => result.current.schedule(prefetch));
		act(() => vi.advanceTimersByTime(INTENT_DELAY_MS - 1));
		expect(prefetch).not.toHaveBeenCalled();
		act(() => vi.advanceTimersByTime(1));
		expect(prefetch).toHaveBeenCalledTimes(1);
	});

	it("drops a prefetch when the pointer moves on, or a newer one replaces it", () => {
		const { result, unmount } = renderHook(() => useIntentPrefetch(100));
		const first = vi.fn();
		const second = vi.fn();
		const third = vi.fn();

		act(() => result.current.schedule(first));
		act(() => result.current.schedule(second));
		act(() => vi.advanceTimersByTime(100));
		act(() => result.current.schedule(third));
		act(() => result.current.cancel());
		act(() => result.current.cancel());
		act(() => vi.advanceTimersByTime(100));

		expect(first).not.toHaveBeenCalled();
		expect(second).toHaveBeenCalledTimes(1);
		expect(third).not.toHaveBeenCalled();

		const late = vi.fn();
		act(() => result.current.schedule(late));
		unmount();
		vi.advanceTimersByTime(100);
		expect(late).not.toHaveBeenCalled();
	});
});
