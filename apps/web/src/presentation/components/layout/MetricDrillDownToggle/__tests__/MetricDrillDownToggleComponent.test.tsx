import { fireEvent, screen } from "@testing-library/react";
import { useState } from "react";
import { renderWithMessages } from "@/application/test/render-with-messages";
import { MetricDrillDownToggle } from "@/presentation/components/layout/MetricDrillDownToggle/MetricDrillDownToggleComponent";
import type { MetricDrillDownPanelProps } from "@/presentation/components/map/MetricDrillDownPanel/MetricDrillDownPanelComponent.types";
import { SidePanelProvider } from "@/presentation/components/providers/SidePanelProvider/SidePanelProviderComponent";
import { useExclusiveSidePanel } from "@/presentation/hooks/use-side-panel/use-exclusive-side-panel";

let flag = true;
let path = "/";
vi.mock("next/navigation", () => ({ usePathname: () => path }));
vi.mock("@/presentation/hooks/use-feature-flags/use-feature-flags", () => ({
	useFeatureFlag: () => flag,
}));
vi.mock("@/presentation/components/map/MetricDrillDownPanel/MetricDrillDownPanelComponent", () => ({
	MetricDrillDownPanel: ({
		isOpen,
		isClosing,
		onClosed,
		onClose,
	}: Pick<MetricDrillDownPanelProps, "isOpen" | "isClosing" | "onClosed" | "onClose">) =>
		isOpen || isClosing ? (
			<aside aria-label="Drill" data-closing={!!isClosing} onAnimationEnd={onClosed}>
				<button type="button" onClick={onClose}>
					Close
				</button>
			</aside>
		) : null,
}));
function OtherPanel() {
	const [open, setOpen] = useState(false);
	useExclusiveSidePanel("market-summary", open, () => setOpen(false));
	return (
		<>
			<button type="button" onClick={() => setOpen(true)}>
				Summary
			</button>
			{open && <aside aria-label="Summary" />}
		</>
	);
}
describe("MetricDrillDownToggle", () => {
	beforeEach(() => {
		flag = true;
		path = "/";
	});
	it("opens and closes with accessible glass control", () => {
		renderWithMessages(<MetricDrillDownToggle />);
		const button = screen.getByRole("button", { name: "Metric drill-down" });
		expect(button).toHaveClass("map-glass");
		expect(button).toHaveAttribute("aria-expanded", "false");
		fireEvent.click(button);
		expect(screen.getByRole("complementary")).toBeInTheDocument();
		fireEvent.click(button);
		expect(screen.getByRole("complementary")).toHaveAttribute("data-closing", "true");
		fireEvent(
			screen.getByRole("complementary"),
			new Event("webkitAnimationEnd", { bubbles: true }),
		);
		expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
		fireEvent.click(button);
		fireEvent.click(screen.getByRole("button", { name: "Close" }));
		expect(button).toHaveAttribute("aria-expanded", "false");
	});
	it("hides off-map and when the flag turns off", () => {
		const { rerender } = renderWithMessages(<MetricDrillDownToggle />);
		fireEvent.click(screen.getByRole("button", { name: "Metric drill-down" }));
		flag = false;
		rerender(<MetricDrillDownToggle />);
		expect(screen.queryByRole("button")).not.toBeInTheDocument();
		flag = true;
		path = "/admin";
		rerender(<MetricDrillDownToggle />);
		expect(screen.queryByRole("button")).not.toBeInTheDocument();
	});
	it("shares the exclusive drawer slot with summary", () => {
		renderWithMessages(
			<SidePanelProvider>
				<MetricDrillDownToggle />
				<OtherPanel />
			</SidePanelProvider>,
		);
		fireEvent.click(screen.getByRole("button", { name: "Summary" }));
		fireEvent.click(screen.getByRole("button", { name: "Metric drill-down" }));
		expect(screen.queryByRole("complementary", { name: "Summary" })).not.toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", { name: "Summary" }));
		expect(screen.getByRole("complementary", { name: "Drill" })).toHaveAttribute(
			"data-closing",
			"true",
		);
		fireEvent(
			screen.getByRole("complementary", { name: "Drill" }),
			new Event("webkitAnimationEnd", { bubbles: true }),
		);
		expect(screen.queryByRole("complementary", { name: "Drill" })).not.toBeInTheDocument();
	});
});
