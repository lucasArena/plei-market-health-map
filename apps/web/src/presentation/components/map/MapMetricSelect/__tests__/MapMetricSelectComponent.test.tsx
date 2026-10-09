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

describe("nested Date selector", () => {
	const nested = [
		{ value: "market", label: "Market" },
		{
			value: "date",
			label: "Date",
			children: [
				{ value: "date:day", label: "Day" },
				{ value: "date:week", label: "Week" },
				{ value: "date:month", label: "Month" },
			],
		},
	];
	it("opens an adjacent submenu and commits only a child selection", () => {
		const onChange = vi.fn();
		render(
			<MapMetricSelect
				label="Slice"
				help="Group"
				value="date:week"
				options={nested}
				onChange={onChange}
			/>,
		);
		const trigger = screen.getByRole("combobox");
		expect(trigger).toHaveTextContent("Date · Week");
		fireEvent.click(trigger);
		const date = screen.getByRole("option", { name: "Date" });
		expect(date).toHaveFocus();
		vi.spyOn(date, "getBoundingClientRect").mockReturnValue({
			left: 900,
			right: 1000,
			top: 50,
		} as DOMRect);
		fireEvent.click(date);
		expect(onChange).not.toHaveBeenCalled();
		const week = screen.getByRole("option", { name: "Week" });
		expect(week).toHaveFocus();
		expect(screen.getByRole("listbox", { name: "Date" })).toHaveClass("map-glass");
		expect(week).toHaveClass("rounded-md", "px-2", "py-1.5", "text-xs");
		expect(week.querySelector("svg")).toHaveClass("size-3", "text-muted-foreground");
		expect(screen.getByRole("listbox", { name: "Date" })).toHaveStyle({
			left: "736px",
			top: "50px",
		});
		fireEvent.pointerDown(week);
		expect(screen.getByRole("listbox", { name: "Date" })).toBeInTheDocument();
		fireEvent.click(screen.getByRole("option", { name: "Month" }));
		expect(onChange).toHaveBeenCalledWith("date:month");
		expect(trigger).toHaveFocus();
		expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
	});
	it("supports right/left, child arrows, two-step Escape and outside dismissal", () => {
		render(
			<MapMetricSelect
				label="Slice"
				help="Group"
				value="market"
				options={nested}
				onChange={vi.fn()}
			/>,
		);
		const trigger = screen.getByRole("combobox");
		fireEvent.click(trigger);
		const market = screen.getByRole("option", { name: "Market" });
		fireEvent.keyDown(market, { key: "ArrowRight" });
		expect(screen.queryByRole("listbox", { name: "Date" })).not.toBeInTheDocument();
		fireEvent.keyDown(market, { key: "ArrowDown" });
		const date = screen.getByRole("option", { name: "Date" });
		expect(date).toHaveFocus();
		fireEvent.keyDown(date, { key: "ArrowRight" });
		const day = screen.getByRole("option", { name: "Day" });
		expect(day).toHaveFocus();
		fireEvent.keyDown(day, { key: "ArrowDown" });
		expect(screen.getByRole("option", { name: "Week" })).toHaveFocus();
		fireEvent.keyDown(day, { key: "ArrowLeft" });
		expect(date).toHaveFocus();
		fireEvent.click(date);
		fireEvent.keyDown(screen.getByRole("option", { name: "Day" }), { key: "Escape" });
		expect(date).toHaveFocus();
		expect(screen.getByRole("listbox", { name: "Slice" })).toBeInTheDocument();
		fireEvent.keyDown(date, { key: "Escape" });
		expect(trigger).toHaveFocus();
		fireEvent.click(trigger);
		fireEvent.click(screen.getByRole("option", { name: "Date" }));
		fireEvent.pointerDown(document.body);
		expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
	});
});
