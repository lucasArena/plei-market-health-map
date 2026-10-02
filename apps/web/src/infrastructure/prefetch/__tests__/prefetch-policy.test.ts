import {
	canPrefetchInBackground,
	IDLE_FALLBACK_DELAY_MS,
	whenIdle,
} from "@/infrastructure/prefetch/prefetch-policy";

describe("canPrefetchInBackground", () => {
	it("prefetches unless Data Saver is on or the connection is 2G", () => {
		expect(canPrefetchInBackground({ effectiveType: "4g" })).toBe(true);
		expect(canPrefetchInBackground({})).toBe(true);
		expect(canPrefetchInBackground({ saveData: true, effectiveType: "4g" })).toBe(false);
		expect(canPrefetchInBackground({ effectiveType: "2g" })).toBe(false);
		expect(canPrefetchInBackground({ effectiveType: "slow-2g" })).toBe(false);
	});

	it("allows prefetching when the browser has no connection info", () => {
		expect(canPrefetchInBackground()).toBe(true);
	});
});

describe("whenIdle", () => {
	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllGlobals();
	});

	it("waits for an idle moment and can be cancelled", () => {
		const callbacks: Array<() => void> = [];
		const cancel = vi.fn();
		vi.stubGlobal("requestIdleCallback", (callback: () => void) => callbacks.push(callback));
		vi.stubGlobal("cancelIdleCallback", cancel);
		const run = vi.fn();

		const stop = whenIdle(run);
		callbacks[0]?.();
		stop();

		expect(run).toHaveBeenCalledTimes(1);
		expect(cancel).toHaveBeenCalledWith(1);
	});

	it("falls back to a short delay where idle callbacks don't exist", () => {
		vi.useFakeTimers();
		vi.stubGlobal("requestIdleCallback", undefined);
		const run = vi.fn();

		whenIdle(run);
		vi.advanceTimersByTime(IDLE_FALLBACK_DELAY_MS - 1);
		expect(run).not.toHaveBeenCalled();
		vi.advanceTimersByTime(1);
		expect(run).toHaveBeenCalledTimes(1);

		const late = vi.fn();
		const stop = whenIdle(late);
		stop();
		vi.advanceTimersByTime(IDLE_FALLBACK_DELAY_MS);
		expect(late).not.toHaveBeenCalled();
	});
});
