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
	it("starts on the last week and switches the shared period", () => {
		renderWithMessages(
			<MapScopeProvider>
				<PeriodSwitch />
				<SelectedPeriod />
			</MapScopeProvider>,
		);
		const group = screen.getByRole("group", { name: "Comparison period" });
		const week = screen.getByRole("button", { name: "7D" });
		const month = screen.getByRole("button", { name: "28D" });

		expect(group).toContainElement(week);
		expect(week).toHaveAttribute("aria-pressed", "true");
		expect(week).toHaveAttribute("title", "Last week compared with the week before");
		expect(month).toHaveAttribute("aria-pressed", "false");
		expect(screen.getByText("selected: week")).toBeInTheDocument();

		fireEvent.click(month);

		expect(month).toHaveAttribute("aria-pressed", "true");
		expect(week).toHaveAttribute("aria-pressed", "false");
		expect(screen.getByText("selected: month")).toBeInTheDocument();
	});

	it("only shows on the map", () => {
		mockPathname.mockReturnValue("/metrics");
		renderWithMessages(<PeriodSwitch />);

		expect(screen.queryByRole("group")).not.toBeInTheDocument();
		mockPathname.mockReturnValue("/");
	});
});
