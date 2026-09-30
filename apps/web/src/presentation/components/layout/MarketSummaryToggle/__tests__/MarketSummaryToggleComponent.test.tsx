import { act, fireEvent, screen } from "@testing-library/react";
import { renderWithMessages } from "@/application/test/render-with-messages";
import { MarketSummaryToggle } from "@/presentation/components/layout/MarketSummaryToggle/MarketSummaryToggleComponent";
import { nextToggleState } from "@/presentation/components/layout/MarketSummaryToggle/MarketSummaryToggleComponent.rules";

const panelProps = vi.fn();

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
});
