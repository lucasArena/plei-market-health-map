import { fireEvent, render, screen } from "@testing-library/react";
import { SegmentedControl } from "@/presentation/components/displays/SegmentedControl/SegmentedControlComponent";

describe("SegmentedControl", () => {
	it("presses the selected option and reports a new choice", () => {
		const onChange = vi.fn();
		render(
			<SegmentedControl
				label="Period"
				value="month"
				onChange={onChange}
				options={[
					{ value: "week", label: "7D" },
					{ value: "month", label: "28D" },
				]}
			/>,
		);

		expect(screen.getByRole("button", { name: "28D" })).toHaveAttribute("aria-pressed", "true");
		expect(screen.getByRole("button", { name: "7D" })).toHaveAttribute("aria-pressed", "false");
		fireEvent.click(screen.getByRole("button", { name: "7D" }));
		expect(onChange).toHaveBeenCalledWith("week");
	});
});
