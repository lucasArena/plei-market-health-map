import type { FacilityPointView } from "@market-health-map/core/application";
import { act, fireEvent, screen, within } from "@testing-library/react";
import { createRef } from "react";
import { renderWithMessages } from "@/application/test/render-with-messages";
import { MetricDrillDownPanel } from "@/presentation/components/map/MetricDrillDownPanel/MetricDrillDownPanelComponent";
import type { MapScope } from "@/presentation/components/providers/MapScopeProvider/MapScopeProviderComponent.types";

const navigate = vi.fn();
const retry = vi.fn();
let scope: MapScope = { kind: "all" };
let period = "month";
const facility: FacilityPointView = {
	id: "a",
	name: "Arena",
	marketId: "miami",
	marketName: "Miami",
	avatarUrl: null,
	location: { latitude: 25, longitude: -80 },
	isActive: true,
	isActiveLastWeek: false,
	gamesLast28Days: 10,
	gamesLastWeek: 0,
	gamesByDepartment: { magic: 2, organizers: 3, partnerships: 5 },
	gamesLastWeekByDepartment: { magic: 0, organizers: 0, partnerships: 0 },
};
let data: FacilityPointView[] = [];
let pending = false;
let failed = false;
vi.mock("@/presentation/components/providers/MapScopeProvider/MapScopeProviderComponent", () => ({
	useMapScope: () => ({ scope, period, setMapNavigation: navigate }),
}));
vi.mock("@/presentation/hooks/use-facility/use-facility-list-all", () => ({
	useFacilityListAll: () => ({ data, isPending: pending, isError: failed, refetch: retry }),
}));
function setup(isOpen = true) {
	const onClose = vi.fn();
	const triggerRef = createRef<HTMLButtonElement>();
	const props = { isOpen, onClose, triggerRef };
	const result = renderWithMessages(
		<>
			<button type="button" ref={triggerRef}>
				Trigger
			</button>
			<MetricDrillDownPanel {...props} />
		</>,
	);
	return {
		...result,
		onClose,
		props,
		rerender: (element: React.ReactElement) =>
			result.rerender(
				<>
					<button type="button" ref={triggerRef}>
						Trigger
					</button>
					{element}
				</>,
			),
	};
}
function select(name: string, value: string) {
	fireEvent.change(screen.getByRole("combobox", { name }), { target: { value } });
}
describe("MetricDrillDownPanel", () => {
	beforeEach(() => {
		scope = { kind: "all" };
		period = "month";
		data = [
			facility,
			{
				...facility,
				id: "b",
				name: "Bay",
				gamesLast28Days: 4,
				gamesByDepartment: { magic: 1, organizers: 1, partnerships: 2 },
			},
			{
				...facility,
				id: "c",
				marketId: "orlando",
				marketName: "Orlando",
				name: "Court",
				gamesLast28Days: 2,
				gamesByDepartment: { magic: 0, organizers: 1, partnerships: 1 },
			},
		];
		pending = false;
		failed = false;
		navigate.mockClear();
		retry.mockClear();
	});
	it("uses the summary glass surface and slides out before unmounting", () => {
		const { props, rerender } = setup();
		const panel = screen.getByRole("complementary");
		expect(panel).toHaveClass("map-glass", "panel-slide-in");
		const onClosed = vi.fn();
		fireEvent(panel, new Event("webkitAnimationEnd", { bubbles: true }));
		rerender(<MetricDrillDownPanel {...props} isOpen={false} isClosing onClosed={onClosed} />);
		expect(panel).toHaveClass("panel-slide-out");
		fireEvent(
			screen.getByRole("button", { name: "Close drill-down" }),
			new Event("webkitAnimationEnd", { bubbles: true }),
		);
		expect(onClosed).not.toHaveBeenCalled();
		fireEvent(panel, new Event("webkitAnimationEnd", { bubbles: true }));
		expect(onClosed).toHaveBeenCalledOnce();
	});
	it("expands the vertical chart without resetting selections, then collapses with Escape", () => {
		const { onClose } = setup();
		select("Segment", "department");
		const bar = screen.getByRole("button", { name: "Miami · Magic: 3" });
		expect(bar.style.height).toBe("20%");
		expect(bar.style.width).toBe("");
		fireEvent.click(screen.getByRole("button", { name: "Expand drill-down" }));
		expect(screen.getByRole("button", { name: "Collapse drill-down" })).toHaveAttribute(
			"aria-pressed",
			"true",
		);
		expect(screen.getByRole("combobox", { name: "Segment" })).toHaveValue("department");
		fireEvent.click(screen.getByRole("button", { name: "Collapse drill-down" }));
		fireEvent.click(screen.getByRole("button", { name: "Expand drill-down" }));
		fireEvent.keyDown(document, { key: "Escape" });
		expect(screen.getByRole("button", { name: "Expand drill-down" })).toHaveAttribute(
			"aria-pressed",
			"false",
		);
		expect(onClose).not.toHaveBeenCalled();
		fireEvent.keyDown(document, { key: "Escape" });
		expect(onClose).toHaveBeenCalledOnce();
	});

	it("sorts unavailable data after known counts and preserves equal-name groups", () => {
		data = [
			{ ...facility, gamesLast28Days: undefined },
			{ ...facility, id: "b", marketId: "other", gamesLast28Days: 10 },
			{ ...facility, id: "c", marketId: "unknown", gamesLast28Days: undefined },
		];
		setup();
		const table = screen.getByRole("table");
		expect(within(table).getAllByRole("row")[1]).toHaveTextContent("10");
		fireEvent.click(screen.getByRole("button", { name: /Count ↕/ }));
		expect(within(table).getAllByRole("row")[1]).toHaveTextContent("10");
		select("Measure", "active-facilities");
		expect(screen.getByRole("combobox", { name: "Slice" })).toHaveValue("market");
	});
	it("counts games when department breakdowns are missing without inventing a segment", () => {
		data = [{ ...facility, gamesByDepartment: undefined }];
		setup();
		select("Segment", "department");
		expect(
			screen.getByText(
				"Some game counts are unavailable. Totals containing missing data are not shown.",
			),
		).toBeInTheDocument();
		expect(screen.getByText("10", { selector: "p" })).toBeInTheDocument();
	});
	it("allows unsegmented facility bar activation without changing map scope", () => {
		setup();
		select("Slice", "facility");
		fireEvent.click(screen.getByRole("button", { name: "Arena: 10" }));
		expect(navigate).not.toHaveBeenCalled();
	});

	it("defaults to games by market and supports local drill and back", () => {
		setup();
		expect(screen.getByRole("combobox", { name: "Measure" })).toHaveValue("games");
		expect(screen.getByText("16")).toBeInTheDocument();
		fireEvent.click(within(screen.getByRole("table")).getByRole("button", { name: "Miami" }));
		expect(navigate).not.toHaveBeenCalled();
		expect(screen.getByRole("combobox", { name: "Slice" })).toHaveValue("facility");
		expect(screen.getByRole("button", { name: /Back to overview/ })).toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", { name: /Back to overview/ }));
		expect(screen.getByRole("combobox", { name: "Slice" })).toHaveValue("market");
	});
	it("keeps department segments on market drill and reports exact values", () => {
		setup();
		select("Segment", "department");
		fireEvent.click(screen.getByRole("button", { name: "Miami · Magic: 3" }));
		expect(screen.getByRole("combobox", { name: "Slice" })).toHaveValue("facility");
		expect(screen.getByRole("combobox", { name: "Segment" })).toBeDisabled();
		expect(within(screen.getByRole("table")).getByText("2")).toBeInTheDocument();
	});
	it("offers department slices only for games and disables overlapping facility segments", () => {
		setup();
		select("Slice", "department");
		expect(screen.getByRole("combobox", { name: "Segment" })).toBeDisabled();
		expect(within(screen.getByRole("table")).getByText("Magic")).toBeInTheDocument();
		select("Measure", "active-facilities");
		expect(screen.getByRole("combobox", { name: "Slice" })).toHaveValue("market");
		expect(screen.queryByRole("option", { name: "Department" })).toBeInTheDocument();
		expect(screen.getByRole("combobox", { name: "Segment" })).toHaveValue("none");
		select("Measure", "games");
		select("Slice", "facility");
		select("Segment", "department");
		expect(screen.getByRole("button", { name: "Arena · Magic: 2" })).toBeInTheDocument();
	});
	it("sorts all table groups independently of the top-ten chart", () => {
		data = Array.from({ length: 12 }, (_, index) => ({
			...facility,
			id: `f${index}`,
			name: `Facility ${index}`,
			marketId: `m${index}`,
			marketName: `Market ${index}`,
			gamesLast28Days: index + 1,
		}));
		setup();
		expect(screen.getByText("Top 10 by count")).toBeInTheDocument();
		expect(within(screen.getByRole("table")).getAllByRole("row")).toHaveLength(13);
		fireEvent.click(screen.getByRole("button", { name: /Count ↕/ }));
		expect(within(screen.getByRole("table")).getAllByRole("row")[1]).toHaveTextContent("Market 0");
		fireEvent.click(screen.getByRole("button", { name: /Count ↕/ }));
		fireEvent.click(screen.getByRole("button", { name: /Market ↕/ }));
		expect(within(screen.getByRole("table")).getAllByRole("row")[1]).toHaveTextContent("Market 0");
		fireEvent.click(screen.getByRole("button", { name: /Market ↕/ }));
		expect(screen.getAllByRole("columnheader")[0]).toHaveAttribute("aria-sort", "descending");
	});
	it("requests explicit map navigation for market and facility", () => {
		const { onClose } = setup();
		fireEvent.click(screen.getByRole("button", { name: "View on map: Miami" }));
		expect(navigate).toHaveBeenLastCalledWith({ kind: "market", id: "miami", name: "Miami" });
		expect(onClose).toHaveBeenCalled();
		select("Slice", "facility");
		fireEvent.click(screen.getByRole("button", { name: "View on map: Arena" }));
		expect(navigate).toHaveBeenLastCalledWith({
			kind: "facility",
			id: "a",
			name: "Arena",
			marketName: "Miami",
		});
	});
	it("resets navigation on scope changes and keeps valid choices on period changes", () => {
		const { rerender, props } = setup();
		select("Segment", "department");
		scope = { kind: "market", id: "miami", name: "Miami" };
		rerender(<MetricDrillDownPanel {...props} />);
		expect(screen.getByRole("combobox", { name: "Slice" })).toHaveValue("facility");
		expect(screen.getByRole("combobox", { name: "Segment" })).toHaveValue("department");
		period = "week";
		rerender(<MetricDrillDownPanel {...props} />);
		expect(screen.getByText("No activity in this scope and period.")).toBeInTheDocument();
		scope = { kind: "facility", id: "a", name: "Arena", marketName: "Miami" };
		period = "month";
		rerender(<MetricDrillDownPanel {...props} />);
		expect(within(screen.getByRole("table")).getAllByRole("row")).toHaveLength(2);
		scope = { kind: "all" };
		rerender(<MetricDrillDownPanel {...props} />);
		expect(screen.getByRole("combobox", { name: "Slice" })).toHaveValue("market");
	});
	it("retains selections while closed and returns focus for close and Escape", () => {
		const { rerender, props, onClose } = setup();
		select("Slice", "facility");
		rerender(<MetricDrillDownPanel {...props} isOpen={false} />);
		expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
		rerender(<MetricDrillDownPanel {...props} />);
		expect(screen.getByRole("combobox", { name: "Slice" })).toHaveValue("facility");
		fireEvent.keyDown(document, { key: "Enter" });
		expect(onClose).not.toHaveBeenCalled();
		fireEvent.keyDown(document, { key: "Escape" });
		expect(onClose).toHaveBeenCalledOnce();
		fireEvent.click(screen.getByRole("button", { name: "Close drill-down" }));
		expect(onClose).toHaveBeenCalledTimes(2);
	});
	it("shows loading, retryable failure, missing data and empty states", () => {
		pending = true;
		const { rerender, props } = setup();
		expect(screen.getByRole("status")).toHaveTextContent("Loading metrics");
		pending = false;
		failed = true;
		rerender(<MetricDrillDownPanel {...props} />);
		fireEvent.click(screen.getByRole("button", { name: "Try again" }));
		expect(retry).toHaveBeenCalled();
		failed = false;
		data = [{ ...facility, gamesLast28Days: undefined, gamesByDepartment: undefined }];
		rerender(<MetricDrillDownPanel {...props} />);
		expect(screen.getByRole("status")).toHaveTextContent("Some game counts are unavailable");
		select("Segment", "department");
		expect(screen.getAllByText("Unavailable").length).toBeGreaterThan(1);
		data = [];
		act(() => rerender(<MetricDrillDownPanel {...props} />));
		expect(screen.getByText("No activity in this scope and period.")).toBeInTheDocument();
	});
});
