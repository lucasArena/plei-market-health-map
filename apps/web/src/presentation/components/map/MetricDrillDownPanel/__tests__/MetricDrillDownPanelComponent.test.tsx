import type {
	FacilityPointView,
	GetMetricDrillDownInput,
} from "@market-health-map/core/application";
import {
	aggregateDrillDownFromFacts,
	drillDownWindow,
	factsFromFacilityPoints,
} from "@market-health-map/core/application";
import { act, fireEvent, screen, within } from "@testing-library/react";
import { createRef } from "react";
import { renderWithMessages } from "@/application/test/render-with-messages";
import { MetricDrillDownPanel } from "@/presentation/components/map/MetricDrillDownPanel/MetricDrillDownPanelComponent";
import type { MapScope } from "@/presentation/components/providers/MapScopeProvider/MapScopeProviderComponent.types";

const navigate = vi.fn();
const retry = vi.fn();
const setMetricFocus = vi.fn();
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
let gameDepartments: ("magic" | "organizers" | "partnerships")[] = [];
let showSupply = true;
vi.mock("@/presentation/components/map/MapLayersPanel/MapLayersPanelComponent.context", () => ({
	useMapLayers: () => ({ gameDepartments, showActiveFacilities: showSupply }),
}));
vi.mock("@/presentation/components/providers/MapScopeProvider/MapScopeProviderComponent", () => ({
	useMapScope: () => ({ scope, period, setMapNavigation: navigate, setMetricFocus }),
}));
vi.mock("@/presentation/hooks/use-facility/use-facility-list-all", () => ({
	useFacilityListAll: () => ({ data, isPending: false, isError: false, refetch: vi.fn() }),
}));
vi.mock("@/presentation/hooks/use-metric/use-metric-drill-down", () => ({
	useMetricDrillDown: (input: GetMetricDrillDownInput & { enabled?: boolean }) => {
		if (!input.enabled) {
			return { data: undefined, isPending: false, isError: false, refetch: retry };
		}
		if (pending) return { data: undefined, isPending: true, isError: false, refetch: retry };
		if (failed) return { data: undefined, isPending: false, isError: true, refetch: retry };
		const { start, end } = drillDownWindow(
			new Date("2026-10-08T12:00:00Z"),
			"America/New_York",
			input.range,
		);
		const view = aggregateDrillDownFromFacts({
			facilities: factsFromFacilityPoints(data, input.range === "7d" ? "7d" : "28d").map(
				(facility) => ({
					...facility,
					scheduled: facility.games === null ? null : (facility.games ?? 0) + 2,
					scheduledByDepartment: facility.gamesByDepartment
						? {
								magic: facility.gamesByDepartment.magic + 1,
								organizers: facility.gamesByDepartment.organizers,
								partnerships: facility.gamesByDepartment.partnerships + 1,
							}
						: null,
					uniquePlayerIds: facility.id === "a" ? ["p1", "p2"] : ["p1", "p3"],
					uniquePlayerIdsByDepartment: {
						magic: ["p1"],
						organizers: facility.id === "a" ? ["p2"] : ["p3"],
						partnerships: [],
					},
					activatedPlayerIds: facility.id === "a" ? ["p2"] : ["p3"],
					activatedPlayerIdsByDepartment: {
						magic: [],
						organizers: facility.id === "a" ? ["p2"] : ["p3"],
						partnerships: [],
					},
				}),
			),
			measure: input.measure,
			slice: input.slice,
			marketId: input.marketId,
			facilityId: input.facilityId,
			department: input.department,
			gameDepartments: input.departments,
			start,
			end,
			range: input.range,
		});
		return { data: view, isPending: false, isError: false, refetch: retry };
	},
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
	const labels = {
		games: "Games played",
		"active-facilities": "Active facilities",
		"scheduled-games": "Scheduled games",
		"confirmation-rate": "Confirmation rate",
		"unique-players": "Unique players",
		"activated-players": "Activated players",
		market: "Market",
		facility: "Facility",
		department: "Department",
		none: "None",
		"7d": "7D",
		"28d": "28D",
		"90d": "90D",
		"6m": "6M",
		"12m": "12M",
	};
	fireEvent.click(screen.getByRole("combobox", { name }));
	fireEvent.click(screen.getByRole("option", { name: labels[value as keyof typeof labels] }));
}
describe("MetricDrillDownPanel", () => {
	beforeEach(() => {
		gameDepartments = [];
		showSupply = true;
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
	it("toggles from count cells and keyboard while map icons remain independent", () => {
		setup();
		const row = within(screen.getByRole("table")).getByRole("row", { name: /Miami/ });
		fireEvent.click(within(row).getByText("14"));
		expect(row).toHaveAttribute("aria-selected", "true");
		expect(row).not.toHaveClass("outline-1");
		fireEvent.click(within(row).getByRole("button", { name: "View on map: Miami" }));
		expect(row).toHaveAttribute("aria-selected", "true");
		fireEvent.keyDown(within(row).getByRole("button"), { key: "Enter" });
		expect(row).toHaveAttribute("aria-selected", "true");
		fireEvent.keyDown(row, { key: "Escape" });
		expect(row).toHaveAttribute("aria-selected", "true");
		fireEvent.keyDown(row, { key: "Enter" });
		expect(row).toHaveAttribute("aria-selected", "false");
		fireEvent.keyDown(row, { key: " " });
		expect(row).toHaveAttribute("aria-selected", "true");
	});

	it("filters chart and table by selection and restores groups when cleared", () => {
		setup();
		const bar = screen.getByRole("button", { name: "Miami: 14" });
		fireEvent.click(bar);
		expect(bar).toHaveAttribute("aria-pressed", "true");
		expect(screen.getByText("14", { selector: "p" })).toBeInTheDocument();
		expect(screen.queryByRole("button", { name: "Orlando: 2" })).not.toBeInTheDocument();
		expect(within(screen.getByRole("table")).getAllByRole("row")).toHaveLength(2);
		expect(setMetricFocus).toHaveBeenLastCalledWith({
			facilityIds: ["a", "b"],
			department: undefined,
		});
		fireEvent.click(within(screen.getByRole("table")).getByRole("row", { name: /Miami/ }));
		expect(bar).toHaveAttribute("aria-pressed", "false");
		expect(screen.getByText("16", { selector: "p" })).toBeInTheDocument();
		expect(setMetricFocus).toHaveBeenLastCalledWith(null);
		expect(within(screen.getByRole("table")).getAllByRole("row")).toHaveLength(3);
	});
	it("selects a department segment, clears it, and supports department slices", () => {
		setup();
		select("Segment", "department");
		const bar = screen.getByRole("button", { name: "Miami · Magic: 3" });
		fireEvent.click(bar);
		expect(setMetricFocus).toHaveBeenLastCalledWith({
			facilityIds: ["a", "b"],
			department: "magic",
		});
		expect(screen.getByText("3", { selector: "p" })).toBeInTheDocument();
		expect(screen.queryByRole("button", { name: "Miami · Organizers: 4" })).not.toBeInTheDocument();
		fireEvent.click(bar);
		expect(setMetricFocus).toHaveBeenLastCalledWith(null);
		select("Slice", "department");
		fireEvent.click(screen.getByRole("button", { name: "Magic: 3" }));
		expect(setMetricFocus).toHaveBeenLastCalledWith({
			facilityIds: ["a", "b", "c"],
			department: "magic",
		});
	});
	it("can clear shared market scope after View on map", () => {
		scope = { kind: "market", id: "miami", name: "Miami" };
		setup();
		fireEvent.click(screen.getByRole("button", { name: "Arena: 10" }));
		expect(setMetricFocus).toHaveBeenLastCalledWith({ facilityIds: ["a"], department: undefined });
		fireEvent.click(screen.getByRole("button", { name: /All markets/ }));
		expect(navigate).toHaveBeenLastCalledWith({ kind: "all" });
		expect(setMetricFocus).toHaveBeenLastCalledWith(null);
	});

	it("updates totals, segments and drill navigation when applied map filters change", () => {
		const { props, rerender } = setup();
		select("Segment", "department");
		gameDepartments = ["magic"];
		rerender(<MetricDrillDownPanel {...props} />);
		expect(screen.getByRole("button", { name: "Miami · Magic: 3" })).not.toHaveAttribute("title");
		expect(screen.queryByRole("button", { name: /Organizers:/ })).not.toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", { name: "Miami · Magic: 3" }));
		select("Slice", "facility");
		gameDepartments = ["organizers"];
		rerender(<MetricDrillDownPanel {...props} />);
		expect(screen.getByRole("button", { name: "Arena · Organizers: 3" })).toBeInTheDocument();
		gameDepartments = [];
		rerender(<MetricDrillDownPanel {...props} />);
		expect(screen.getByRole("button", { name: "Arena · Partnerships: 5" })).toBeInTheDocument();
		showSupply = false;
		rerender(<MetricDrillDownPanel {...props} />);
		expect(screen.getByText("No activity in this scope and period.")).toBeInTheDocument();
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
			screen.getByRole("button", { name: "Expand drill-down" }),
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
		expect(screen.getByRole("combobox", { name: "Segment" })).toHaveTextContent("Department");
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
		expect(screen.getByRole("combobox", { name: "Slice" })).toHaveTextContent("Market");
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

	it("keeps grouping stable when filtering and hides removed textual actions", () => {
		setup();
		fireEvent.click(screen.getByRole("button", { name: "Miami: 14" }));
		expect(screen.getByRole("combobox", { name: "Slice" })).toHaveTextContent("Market");
		expect(screen.queryByRole("button", { name: /Explore facilities/ })).not.toBeInTheDocument();
		const mapButton = screen.getByRole("button", { name: "View on map: Miami" });
		expect(mapButton).not.toHaveTextContent("View on map");
		expect(screen.getByRole("button", { name: /Count ↕/ })).toHaveClass(
			"whitespace-nowrap",
			"inline-flex",
		);
		expect(navigate).not.toHaveBeenCalled();
	});

	it("offers department slices for game and player measures and hides them for active facilities", () => {
		setup();
		select("Slice", "department");
		expect(screen.getByRole("combobox", { name: "Segment" })).toBeDisabled();
		expect(within(screen.getByRole("table")).getByText("Magic")).toBeInTheDocument();
		select("Measure", "scheduled-games");
		expect(screen.getByRole("combobox", { name: "Slice" })).toHaveTextContent("Department");
		expect(screen.getByRole("combobox", { name: "Measure" })).toHaveTextContent("Scheduled games");
		select("Measure", "confirmation-rate");
		expect(screen.getByRole("combobox", { name: "Measure" })).toHaveTextContent(
			"Confirmation rate",
		);
		expect(screen.getByRole("button", { name: /Rate ↕/ })).toBeInTheDocument();
		select("Measure", "unique-players");
		expect(screen.getByRole("combobox", { name: "Measure" })).toHaveTextContent("Unique players");
		select("Measure", "activated-players");
		expect(screen.getByRole("combobox", { name: "Measure" })).toHaveTextContent(
			"Activated players",
		);
		select("Measure", "active-facilities");
		expect(screen.getByRole("combobox", { name: "Slice" })).toHaveTextContent("Market");
		fireEvent.click(screen.getByRole("combobox", { name: "Slice" }));
		expect(screen.queryByRole("option", { name: "Department" })).not.toBeInTheDocument();
		fireEvent.keyDown(screen.getByRole("combobox", { name: "Slice" }), { key: "Escape" });
		expect(screen.getByRole("combobox", { name: "Segment" })).toHaveTextContent("None");
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
		expect(screen.getByText("Top 10")).toBeInTheDocument();
		expect(within(screen.getByRole("table")).getAllByRole("row")).toHaveLength(13);
		fireEvent.click(screen.getByRole("button", { name: /Count ↕/ }));
		expect(within(screen.getByRole("table")).getAllByRole("row")[1]).toHaveTextContent("Market 0");
		fireEvent.click(screen.getByRole("button", { name: /Count ↕/ }));
		fireEvent.click(screen.getByRole("button", { name: /Market ↕/ }));
		expect(within(screen.getByRole("table")).getAllByRole("row")[1]).toHaveTextContent("Market 0");
		fireEvent.click(screen.getByRole("button", { name: /Market ↕/ }));
		expect(screen.getAllByRole("columnheader")[0]).toHaveAttribute("aria-sort", "descending");
	});
	it("requests zoom only from the map icon without closing or changing metric scope", () => {
		const { onClose } = setup();
		fireEvent.click(screen.getByRole("button", { name: "View on map: Miami" }));
		expect(navigate).toHaveBeenLastCalledWith({ kind: "metric-focus", facilityIds: ["a", "b"] });
		expect(onClose).not.toHaveBeenCalled();
		expect(screen.getByRole("combobox", { name: "Slice" })).toHaveTextContent("Market");
		select("Slice", "facility");
		fireEvent.click(screen.getByRole("button", { name: "View on map: Arena" }));
		expect(navigate).toHaveBeenLastCalledWith({ kind: "metric-focus", facilityIds: ["a"] });
		expect(onClose).not.toHaveBeenCalled();
	});

	it("resets navigation on scope changes and keeps valid choices on period changes", () => {
		const { rerender, props } = setup();
		select("Segment", "department");
		scope = { kind: "market", id: "miami", name: "Miami" };
		rerender(<MetricDrillDownPanel {...props} />);
		expect(screen.getByRole("combobox", { name: "Slice" })).toHaveTextContent("Facility");
		expect(screen.getByRole("combobox", { name: "Segment" })).toHaveTextContent("Department");
		period = "week";
		rerender(<MetricDrillDownPanel {...props} />);
		expect(screen.getByText("No activity in this scope and period.")).toBeInTheDocument();
		scope = { kind: "facility", id: "a", name: "Arena", marketName: "Miami" };
		period = "month";
		rerender(<MetricDrillDownPanel {...props} />);
		expect(within(screen.getByRole("table")).getAllByRole("row")).toHaveLength(2);
		scope = { kind: "all" };
		rerender(<MetricDrillDownPanel {...props} />);
		expect(screen.getByRole("combobox", { name: "Slice" })).toHaveTextContent("Market");
	});
	it("defaults the date range from the map period and supports longer ranges", () => {
		const { props, rerender } = setup();
		expect(screen.getByRole("combobox", { name: "Date range" })).toHaveTextContent("28D");
		select("Date range", "90d");
		expect(screen.getByRole("combobox", { name: "Date range" })).toHaveTextContent("90D");
		period = "week";
		rerender(<MetricDrillDownPanel {...props} />);
		expect(screen.getByRole("combobox", { name: "Date range" })).toHaveTextContent("7D");
	});
	it("has no close button and focuses the expand button when it opens", () => {
		setup();
		expect(screen.queryByRole("button", { name: /close/i })).not.toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Expand drill-down" })).toHaveFocus();
	});
	it("retains selections while closed and closes with Escape, returning focus to the toggle", () => {
		const { rerender, props, onClose } = setup();
		select("Slice", "facility");
		rerender(<MetricDrillDownPanel {...props} isOpen={false} />);
		expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
		rerender(<MetricDrillDownPanel {...props} />);
		expect(screen.getByRole("combobox", { name: "Slice" })).toHaveTextContent("Facility");
		fireEvent.keyDown(document, { key: "Enter" });
		expect(onClose).not.toHaveBeenCalled();
		fireEvent.keyDown(document, { key: "Escape" });
		expect(onClose).toHaveBeenCalledOnce();
		expect(screen.getByRole("button", { name: "Trigger" })).toHaveFocus();
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
