import { act, fireEvent, screen } from "@testing-library/react";
import { useState } from "react";
import { renderWithMessages } from "@/application/test/render-with-messages";
import { MarketSummaryToggle } from "@/presentation/components/layout/MarketSummaryToggle/MarketSummaryToggleComponent";
import { nextToggleState } from "@/presentation/components/layout/MarketSummaryToggle/MarketSummaryToggleComponent.rules";
import { SidePanelProvider } from "@/presentation/components/providers/SidePanelProvider/SidePanelProviderComponent";
import { useExclusiveSidePanel } from "@/presentation/hooks/use-side-panel/use-exclusive-side-panel";

const panelProps = vi.fn();
const mockPathname = vi.fn(() => "/");

vi.mock("next/navigation", () => ({ usePathname: () => mockPathname() }));

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
	beforeEach(() => panelProps.mockClear());

	it("cycles closed, open, closing and back open", () => {
		expect(nextToggleState("closed")).toBe("open");
		expect(nextToggleState("open")).toBe("closing");
		expect(nextToggleState("closing")).toBe("open");
	});

	it("keeps the panel unmounted until the button is pressed", () => {
		renderWithMessages(<MarketSummaryToggle />);

		const button = screen.getByRole("button", { name: "Market summary" });
		expect(button).toHaveAttribute("title", "Market summary");
		expect(button).toHaveAttribute("aria-expanded", "false");
		expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
		expect(panelProps).not.toHaveBeenCalled();
	});

	it("opens, slides out when pressed again, and unmounts after the animation", () => {
		renderWithMessages(<MarketSummaryToggle />);
		const button = screen.getByRole("button", { name: "Market summary" });

		fireEvent.click(button);
		expect(button).toHaveAttribute("aria-expanded", "true");
		expect(button.className).toContain("bg-pleiful-pitch-green-80");
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

		mockPathname.mockReturnValue("/metrics");
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
});
