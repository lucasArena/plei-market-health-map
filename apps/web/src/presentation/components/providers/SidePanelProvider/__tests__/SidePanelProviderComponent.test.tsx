import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import {
	SidePanelProvider,
	useSidePanels,
} from "@/presentation/components/providers/SidePanelProvider/SidePanelProviderComponent";

function wrapper({ children }: { children: ReactNode }) {
	return <SidePanelProvider>{children}</SidePanelProvider>;
}

describe("SidePanelProvider", () => {
	it("tracks which side panel is open and only lets the open one release it", () => {
		const { result } = renderHook(() => useSidePanels(), { wrapper });
		expect(result.current.activePanel).toBeNull();

		act(() => result.current.openPanel("market-summary"));
		expect(result.current.activePanel).toBe("market-summary");

		act(() => result.current.openPanel("facility-detail"));
		act(() => result.current.releasePanel("market-summary"));
		expect(result.current.activePanel).toBe("facility-detail");

		act(() => result.current.releasePanel("facility-detail"));
		expect(result.current.activePanel).toBeNull();
	});

	it("does nothing outside a provider", () => {
		const { result } = renderHook(() => useSidePanels());

		expect(() => result.current.openPanel("facility-detail")).not.toThrow();
		expect(() => result.current.releasePanel("facility-detail")).not.toThrow();
		expect(result.current.activePanel).toBeNull();
	});

	it("closes a panel through the closer it registered", () => {
		const { result } = renderHook(() => useSidePanels(), { wrapper });
		const close = vi.fn();
		const other = vi.fn();

		let unregister = () => undefined as void;
		act(() => {
			unregister = result.current.registerCloser("facility-detail", close);
		});
		act(() => result.current.closePanel("facility-detail"));
		act(() => result.current.closePanel("market-summary"));
		expect(close).toHaveBeenCalledTimes(1);

		const unregisterOther = result.current.registerCloser("facility-detail", other);
		unregister();
		result.current.closePanel("facility-detail");
		expect(other).toHaveBeenCalledTimes(1);
		unregisterOther();
		result.current.closePanel("facility-detail");
		expect(other).toHaveBeenCalledTimes(1);
	});

	it("ignores closers outside a provider", () => {
		const { result } = renderHook(() => useSidePanels());

		expect(() => result.current.registerCloser("facility-detail", vi.fn())()).not.toThrow();
		expect(() => result.current.closePanel("facility-detail")).not.toThrow();
	});
});
