import { fireEvent, screen } from "@testing-library/react";
import { renderWithMessages } from "@/application/test/render-with-messages";
import { PeriodSwitch } from "@/presentation/components/inputs/PeriodSwitch/PeriodSwitchComponent";
import {
	MapScopeProvider,
	useMapScope,
} from "@/presentation/components/providers/MapScopeProvider/MapScopeProviderComponent";

const mockPathname = vi.fn(() => "/");

vi.mock("next/navigation", () => ({ usePathname: () => mockPathname() }));

function SelectedPeriod() {
	return <p>selected: {useMapScope().period}</p>;
}

describe("PeriodSwitch", () => {
	it("starts on the last week and slides the green thumb when switching", () => {
		const widths = { "7D": 32, "28D": 40 };
		const lefts = { "7D": 3, "28D": 35 };
		const originalOffsetLeft = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetLeft");
		const originalOffsetWidth = Object.getOwnPropertyDescriptor(
			HTMLElement.prototype,
			"offsetWidth",
		);
		Object.defineProperty(HTMLElement.prototype, "offsetLeft", {
			configurable: true,
			get() {
				const label = this.textContent?.trim() ?? "";
				return lefts[label as keyof typeof lefts] ?? 0;
			},
		});
		Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
			configurable: true,
			get() {
				const label = this.textContent?.trim() ?? "";
				return widths[label as keyof typeof widths] ?? 0;
			},
		});

		renderWithMessages(
			<MapScopeProvider>
				<PeriodSwitch />
				<SelectedPeriod />
			</MapScopeProvider>,
		);
		const group = screen.getByRole("group", { name: "Comparison period" });
		const week = screen.getByRole("button", { name: "7D" });
		const month = screen.getByRole("button", { name: "28D" });
		const thumb = screen.getByTestId("period-switch-thumb");

		expect(group).toContainElement(week);
		expect(group).toContainElement(thumb);
		expect(week).toHaveAttribute("aria-pressed", "true");
		expect(week).toHaveAttribute("title", "Last week compared with the week before");
		expect(week).toHaveClass("text-white", "active:scale-[0.94]");
		expect(week).not.toHaveClass("bg-pleiful-pitch-green-80");
		expect(month).toHaveAttribute("aria-pressed", "false");
		expect(thumb).toHaveClass("bg-pleiful-pitch-green-80");
		expect(thumb).toHaveStyle({ opacity: "1", width: "32px", transform: "translateX(3px)" });
		expect(screen.getByText("selected: week")).toBeInTheDocument();

		fireEvent.click(month);

		expect(month).toHaveAttribute("aria-pressed", "true");
		expect(week).toHaveAttribute("aria-pressed", "false");
		expect(month).toHaveClass("text-white");
		expect(thumb).toHaveStyle({ width: "40px", transform: "translateX(35px)" });
		expect(screen.getByText("selected: month")).toBeInTheDocument();

		if (originalOffsetLeft)
			Object.defineProperty(HTMLElement.prototype, "offsetLeft", originalOffsetLeft);
		else Reflect.deleteProperty(HTMLElement.prototype, "offsetLeft");
		if (originalOffsetWidth) {
			Object.defineProperty(HTMLElement.prototype, "offsetWidth", originalOffsetWidth);
		} else Reflect.deleteProperty(HTMLElement.prototype, "offsetWidth");
	});

	it("clears option refs when the switch unmounts", () => {
		const { unmount } = renderWithMessages(<PeriodSwitch />);
		expect(screen.getByTestId("period-switch-thumb")).toBeInTheDocument();
		unmount();
		expect(screen.queryByTestId("period-switch-thumb")).toBeNull();
	});

	it("only shows on the map", () => {
		mockPathname.mockReturnValue("/metrics");
		renderWithMessages(<PeriodSwitch />);

		expect(screen.queryByRole("group")).not.toBeInTheDocument();
		mockPathname.mockReturnValue("/");
	});
});
