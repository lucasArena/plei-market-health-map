import { act, renderHook } from "@testing-library/react";
import { type ReactNode, useState } from "react";
import { SidePanelProvider } from "@/presentation/components/providers/SidePanelProvider/SidePanelProviderComponent";
import { useExclusiveSidePanel } from "@/presentation/hooks/use-side-panel/use-exclusive-side-panel";

function wrapper({ children }: { children: ReactNode }) {
	return <SidePanelProvider>{children}</SidePanelProvider>;
}

function useTwoPanels(closeMarket: () => void, closeFacility: () => void) {
	const [isMarketOpen, setMarketOpen] = useState(false);
	const [isFacilityOpen, setFacilityOpen] = useState(false);
	useExclusiveSidePanel("market-summary", isMarketOpen, () => {
		closeMarket();
		setMarketOpen(false);
	});
	useExclusiveSidePanel("facility-detail", isFacilityOpen, () => {
		closeFacility();
		setFacilityOpen(false);
	});
	return { isMarketOpen, isFacilityOpen, setMarketOpen, setFacilityOpen };
}

describe("useExclusiveSidePanel", () => {
	it("closes the market summary when a facility panel opens, and the other way around", () => {
		const closeMarket = vi.fn();
		const closeFacility = vi.fn();
		const { result } = renderHook(() => useTwoPanels(closeMarket, closeFacility), { wrapper });

		act(() => result.current.setMarketOpen(true));
		expect(result.current).toMatchObject({ isMarketOpen: true, isFacilityOpen: false });

		act(() => result.current.setFacilityOpen(true));
		expect(closeMarket).toHaveBeenCalledTimes(1);
		expect(result.current).toMatchObject({ isMarketOpen: false, isFacilityOpen: true });

		act(() => result.current.setMarketOpen(true));
		expect(closeFacility).toHaveBeenCalledTimes(1);
		expect(result.current).toMatchObject({ isMarketOpen: true, isFacilityOpen: false });
	});

	it("leaves a panel alone when nothing else opens", () => {
		const closeMarket = vi.fn();
		const { result } = renderHook(() => useTwoPanels(closeMarket, vi.fn()), { wrapper });

		act(() => result.current.setMarketOpen(true));
		act(() => result.current.setMarketOpen(false));
		act(() => result.current.setMarketOpen(true));

		expect(closeMarket).not.toHaveBeenCalled();
	});
});
