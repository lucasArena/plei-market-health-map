import { act, renderHook } from "@testing-library/react";
import type { AnimationEvent } from "react";
import { REVEAL_MOTION_MS, useRevealMotion } from "@/presentation/hooks/use-map/use-reveal-motion";

function animationEnd(sameTarget: boolean) {
	const currentTarget = document.createElement("div");
	const target = sameTarget ? currentTarget : document.createElement("span");
	return { currentTarget, target } as unknown as AnimationEvent<HTMLElement>;
}

describe("useRevealMotion", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("fades in when shown and fades out before unmounting", () => {
		const { result, rerender } = renderHook(({ visible }) => useRevealMotion(visible), {
			initialProps: { visible: false },
		});

		expect(result.current.isShown).toBe(false);
		expect(result.current.motion).toBe("hidden");

		rerender({ visible: true });
		expect(result.current.motion).toBe("enter");
		expect(result.current.isShown).toBe(true);

		act(() => {
			vi.advanceTimersByTime(REVEAL_MOTION_MS.enter);
		});
		expect(result.current.motion).toBe("shown");

		rerender({ visible: false });
		expect(result.current.motion).toBe("exit");
		expect(result.current.isShown).toBe(true);

		act(() => {
			vi.advanceTimersByTime(REVEAL_MOTION_MS.exit);
		});
		expect(result.current.motion).toBe("hidden");
		expect(result.current.isShown).toBe(false);
	});

	it("settles from the element's own animation and ignores children", () => {
		const { result } = renderHook(() => useRevealMotion(true));

		act(() => {
			result.current.finishReveal(animationEnd(false));
		});
		expect(result.current.motion).toBe("enter");

		act(() => {
			result.current.finishReveal(animationEnd(true));
		});
		expect(result.current.motion).toBe("shown");
	});
});
