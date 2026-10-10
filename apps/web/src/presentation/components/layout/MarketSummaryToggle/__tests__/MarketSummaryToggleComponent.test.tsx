import { act, fireEvent, screen } from "@testing-library/react";
import { useState } from "react";
import { renderWithMessages } from "@/application/test/render-with-messages";
import { MarketSummaryToggle } from "@/presentation/components/layout/MarketSummaryToggle/MarketSummaryToggleComponent";
import { nextToggleState } from "@/presentation/components/layout/MarketSummaryToggle/MarketSummaryToggleComponent.rules";
import {
	SidePanelProvider,
	useSidePanels,
} from "@/presentation/components/providers/SidePanelProvider/SidePanelProviderComponent";
import { useExclusiveSidePanel } from "@/presentation/hooks/use-side-panel/use-exclusive-side-panel";

const panelProps = vi.fn();
const mockPathname = vi.fn(() => "/");

vi.mock("next/navigation", () => ({ usePathname: () => mockPathname() }));

const mockPrefetchMarket = vi.fn().mockResolvedValue(undefined);
const mockPrefetchFacility = vi.fn().mockResolvedValue(undefined);
const mockScope = vi.fn(() => ({ kind: "all" }));
const mockDepartments = vi.fn((): string[] => []);
const mockFlag = vi.fn(() => false);
const mockSelectedFacilityId = vi.fn((): string | null => null);

vi.mock("@/presentation/hooks/use-feature-flags/use-feature-flags", () => ({
	useFeatureFlag: () => mockFlag(),
}));

vi.mock("@/presentation/hooks/use-market/prefetch-market-summary", () => ({
	prefetchMarketSummary: (...args: unknown[]) => mockPrefetchMarket(...args),
}));
vi.mock("@/presentation/hooks/use-facility/prefetch-facility-stats", () => ({
	prefetchFacilityStats: (...args: unknown[]) => mockPrefetchFacility(...args),
}));
vi.mock("@/presentation/hooks/use-market/use-market-summary-filters", () => ({
	useMarketSummaryFilters: () => ({ departments: mockDepartments() }),
}));
vi.mock("@/presentation/hooks/use-market/use-idle-market-prefetch", () => ({
	useIdleMarketPrefetch: vi.fn(),
}));
vi.mock("@/presentation/components/providers/MapScopeProvider/MapScopeProviderComponent", () => ({
	useMapScope: () => ({
		scope: mockScope(),
		period: "month",
		selectedFacilityId: mockSelectedFacilityId(),
	}),
}));

vi.mock("@/presentation/components/map/MarketSummaryPanel/MarketSummaryPanelComponent", () => ({
	MarketSummaryPanel: (props: {
		isClosing: boolean;
		onClose: () => void;
		onClosed: () => void;
	}) => {
		panelProps(props);
		return <aside aria-label="Market summary" data-closing={props.isClosing} />;
	},
}));

function FakeFacilityPanel() {
	const [isOpen, setIsOpen] = useState(true);
	useExclusiveSidePanel("facility-detail", isOpen, () => setIsOpen(false));
	return <p>{isOpen ? "facility open" : "facility closed"}</p>;
}

function lastPanelProps() {
	return panelProps.mock.calls.at(-1)?.[0] as {
		isClosing: boolean;
		onClose: () => void;
		onClosed: () => void;
	};
}

describe("MarketSummaryToggle", () => {
	beforeEach(() => {
		panelProps.mockClear();
		mockFlag.mockReturnValue(false);
	});

	it("cycles closed, open, closing and back open", () => {
		expect(nextToggleState("closed")).toBe("open");
		expect(nextToggleState("open")).toBe("closing");
		expect(nextToggleState("closing")).toBe("open");
	});

	it("keeps the panel unmounted until the button is pressed", () => {
		renderWithMessages(<MarketSummaryToggle />);

		const button = screen.getByRole("button", { name: "Market summary" });
		expect(button).toHaveAttribute("title", "Insights panel");
		expect(button).toHaveAttribute("aria-expanded", "false");
		expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
		expect(panelProps).not.toHaveBeenCalled();
	});

	it("opens the panel once on load with the redesigned insights panel", () => {
		mockFlag.mockReturnValue(true);
		renderWithMessages(<MarketSummaryToggle />);
		const button = screen.getByRole("button", { name: "Market summary" });

		expect(button).toHaveAttribute("aria-expanded", "true");
		fireEvent.click(button);
		act(() => lastPanelProps().onClosed());
		expect(button).toHaveAttribute("aria-expanded", "false");
	});

	it("opens, slides out when pressed again, and unmounts after the animation", () => {
		renderWithMessages(<MarketSummaryToggle />);
		const button = screen.getByRole("button", { name: "Market summary" });

		fireEvent.click(button);
		expect(button).toHaveAttribute("aria-expanded", "true");
		expect(button).toHaveClass("map-icon-button", "map-glass");
		expect(button).not.toHaveClass("bg-pleiful-pitch-green-80");
		expect(lastPanelProps().isClosing).toBe(false);

		fireEvent.click(button);
		expect(lastPanelProps().isClosing).toBe(true);
		expect(button).toHaveAttribute("aria-expanded", "false");

		act(() => lastPanelProps().onClosed());
		expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
	});

	it("closes from the panel and ignores a second close while sliding out", () => {
		renderWithMessages(<MarketSummaryToggle />);
		fireEvent.click(screen.getByRole("button", { name: "Market summary" }));

		act(() => lastPanelProps().onClose());
		expect(lastPanelProps().isClosing).toBe(true);
		act(() => lastPanelProps().onClose());
		expect(lastPanelProps().isClosing).toBe(true);
	});

	it("hides the button and closes the panel away from the map", () => {
		const { rerender } = renderWithMessages(<MarketSummaryToggle />);
		fireEvent.click(screen.getByRole("button", { name: "Market summary" }));
		expect(screen.getByRole("complementary", { name: "Market summary" })).toBeInTheDocument();

		mockPathname.mockReturnValue("/admin/metrics");
		rerender(<MarketSummaryToggle />);

		expect(screen.queryByRole("button", { name: "Market summary" })).not.toBeInTheDocument();
		expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
		mockPathname.mockReturnValue("/");
	});

	it("shows as selected with a facility open and clicking it deselects the facility", () => {
		renderWithMessages(
			<SidePanelProvider>
				<FakeFacilityPanel />
				<MarketSummaryToggle />
			</SidePanelProvider>,
		);
		const button = screen.getByRole("button", { name: "Market summary" });
		expect(button).toHaveAttribute("aria-pressed", "true");

		fireEvent.click(button);

		expect(screen.getByText("facility closed")).toBeInTheDocument();
		expect(button).toHaveAttribute("aria-pressed", "false");
		expect(screen.queryByRole("complementary")).not.toBeInTheDocument();

		fireEvent.click(button);
		expect(screen.getByRole("complementary", { name: "Market summary" })).toBeInTheDocument();
	});

	it("with insights-panel-v3, opens the panel when a facility is picked", () => {
		mockFlag.mockReturnValue(true);
		mockSelectedFacilityId.mockReturnValue("f1");
		renderWithMessages(
			<SidePanelProvider>
				<MarketSummaryToggle />
			</SidePanelProvider>,
		);
		const button = screen.getByRole("button", { name: "Market summary" });

		expect(button).toHaveAttribute("aria-expanded", "true");
		expect(screen.getByRole("complementary", { name: "Market summary" })).toBeInTheDocument();
		mockSelectedFacilityId.mockReturnValue(null);
	});

	it("opens when another panel hands it the side slot", () => {
		function OpenSummary() {
			const { openPanel } = useSidePanels();
			return (
				<button type="button" onClick={() => openPanel("market-summary")}>
					go to market
				</button>
			);
		}
		renderWithMessages(
			<SidePanelProvider>
				<OpenSummary />
				<MarketSummaryToggle />
			</SidePanelProvider>,
		);
		expect(screen.queryByRole("complementary")).not.toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: "go to market" }));

		expect(screen.getByRole("complementary", { name: "Market summary" })).toBeInTheDocument();
	});

	it("loads the drawer's data as soon as the pointer or focus reaches the button", () => {
		const { rerender } = renderWithMessages(<MarketSummaryToggle />);
		const button = () => screen.getByRole("button", { name: "Market summary" });

		fireEvent.pointerEnter(button());
		expect(mockPrefetchMarket).toHaveBeenLastCalledWith(expect.anything(), null, "month", []);

		mockScope.mockReturnValue({ kind: "market", id: "houston" } as never);
		rerender(<MarketSummaryToggle />);
		fireEvent.focus(button());
		expect(mockPrefetchMarket).toHaveBeenLastCalledWith(expect.anything(), "houston", "month", []);

		mockDepartments.mockReturnValue(["organizers"]);
		rerender(<MarketSummaryToggle />);
		fireEvent.pointerEnter(button());
		expect(mockPrefetchMarket).toHaveBeenLastCalledWith(expect.anything(), "houston", "month", [
			"organizers",
		]);
		mockDepartments.mockReturnValue([]);

		mockScope.mockReturnValue({ kind: "facility", id: "889" } as never);
		rerender(<MarketSummaryToggle />);
		fireEvent.pointerEnter(button());
		expect(mockPrefetchFacility).toHaveBeenLastCalledWith(expect.anything(), "889");
		mockScope.mockReturnValue({ kind: "all" });
	});
});
