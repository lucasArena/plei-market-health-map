import { fireEvent, render, screen } from "@testing-library/react";
import { MapMetricSelect } from "@/presentation/components/map/MapMetricSelect/MapMetricSelectComponent";

const options = [
	{ value: "a", label: "Alpha" },
	{ value: "b", label: "Beta" },
];
describe("MapMetricSelect", () => {
	it("uses filter menu styling, one native tooltip and closes after selection", () => {
		const onChange = vi.fn();
		render(
			<MapMetricSelect
				label="Measure"
				help="Choose metric"
				value="a"
				options={options}
				onChange={onChange}
			/>,
		);
		const trigger = screen.getByRole("combobox");
		expect(trigger).toHaveAttribute("title", "Choose metric");
		fireEvent.click(trigger);
		const listbox = screen.getByRole("listbox");
		const alpha = screen.getByRole("option", { name: "Alpha" });
		const beta = screen.getByRole("option", { name: "Beta" });
		expect(listbox).toHaveClass("map-glass");
		expect(listbox).not.toHaveAttribute("style");
		expect(alpha).toHaveFocus();
		expect(alpha.querySelector("svg")).toHaveClass("size-3", "text-muted-foreground");
		expect(alpha.querySelector("path")).toHaveAttribute("d", "m3.5 8.5 3 3 6-6.5");
		expect(beta.querySelector("svg")).toHaveClass("invisible");
		fireEvent.click(screen.getByRole("option", { name: "Beta" }));
		expect(onChange).toHaveBeenCalledWith("b");
		expect(trigger).toHaveFocus();
		expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
	});
	it("supports arrows, home/end, Escape and outside dismissal", () => {
		const onChange = vi.fn();
		render(
			<MapMetricSelect
				label="Slice"
				help="Group"
				value="a"
				options={options}
				onChange={onChange}
				alignRight
			/>,
		);
		const trigger = screen.getByRole("combobox");
		fireEvent.keyDown(trigger, { key: "ArrowDown" });
		const alpha = screen.getByRole("option", { name: "Alpha" });
		const beta = screen.getByRole("option", { name: "Beta" });
		fireEvent.keyDown(alpha, { key: "ArrowDown" });
		expect(beta).toHaveFocus();
		fireEvent.keyDown(beta, { key: "ArrowUp" });
		expect(alpha).toHaveFocus();
		fireEvent.keyDown(alpha, { key: "End" });
		expect(beta).toHaveFocus();
		fireEvent.keyDown(beta, { key: "Home" });
		expect(alpha).toHaveFocus();
		fireEvent.keyDown(alpha, { key: "Escape" });
		expect(trigger).toHaveFocus();
		fireEvent.click(trigger);
		fireEvent.pointerDown(trigger);
		expect(screen.getByRole("listbox")).toBeInTheDocument();
		fireEvent.pointerDown(document.body);
		expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
		fireEvent.click(trigger);
		fireEvent.keyDown(trigger, { key: "Tab" });
		expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
		fireEvent.keyDown(trigger, { key: "x" });
		expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
	});
	it("keeps disabled controls closed with an explanation", () => {
		render(
			<MapMetricSelect
				label="Segment"
				help="Split"
				descriptionId="explanation"
				value="missing"
				options={options}
				onChange={vi.fn()}
				disabled
			/>,
		);
		const trigger = screen.getByRole("combobox");
		expect(trigger).toBeDisabled();
		expect(trigger).toHaveAttribute("aria-describedby", "explanation");
		fireEvent.keyDown(trigger, { key: "ArrowDown" });
		expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
	});
});
