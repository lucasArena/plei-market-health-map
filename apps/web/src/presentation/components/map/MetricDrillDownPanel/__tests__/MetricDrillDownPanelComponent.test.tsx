import type {
	FacilityPointView,
	GetMetricDrillDownInput,
	MetricDrillDownView,
} from "@market-health-map/core/application";
import {
	aggregateDrillDownFromFacts,
	DRILL_DOWN_MEASURE_KIND,
	drillDownWindow,
	factsFromFacilityPoints,
	isAppActivityMeasure,
} from "@market-health-map/core/application";
import { act, fireEvent, screen, within } from "@testing-library/react";
import { createRef } from "react";
import { renderWithMessages } from "@/application/test/render-with-messages";
import { MetricDrillDownPanel } from "@/presentation/components/map/MetricDrillDownPanel/MetricDrillDownPanelComponent";
import type { MapScope } from "@/presentation/components/providers/MapScopeProvider/MapScopeProviderComponent.types";

const navigate = vi.fn();
const retry = vi.fn();
const setMetricFocus = vi.fn();
const demandInputs = vi.fn();
const comparisonInputs = vi.fn();
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
let timeView: MetricDrillDownView | undefined;
let comparisonView: MetricDrillDownView | undefined;
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
		comparisonInputs(input);
		if (!input.enabled) {
			return { data: undefined, isPending: false, isError: false, refetch: retry };
		}
		if (comparisonView && input.slice !== "time")
			return { data: comparisonView, isPending: false, isError: false, refetch: retry };
		if (pending) return { data: undefined, isPending: true, isError: false, refetch: retry };
		if (failed) return { data: undefined, isPending: false, isError: true, refetch: retry };
		const { start, end } = drillDownWindow(
			new Date("2026-10-08T12:00:00Z"),
			"America/New_York",
			input.range,
		);
		if (input.slice === "time") {
			demandInputs(input);
			return { data: timeView, isPending: false, isError: false, refetch: retry };
		}
		if (isAppActivityMeasure(input.measure)) {
			demandInputs(input);
			return {
				data: {
					measure: input.measure,
					range: input.range,
					kind: DRILL_DOWN_MEASURE_KIND[input.measure],
					start,
					end,
					total: 3,
					rows: [{ id: "miami", name: "Miami", value: 3, departments: null }],
				},
				isPending: false,
				isError: false,
				refetch: retry,
			};
		}
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
					almostFilled: 1,
					almostFilledByDepartment: { magic: 1, organizers: 0, partnerships: 0 },
					rosteredCanceled: 4,
					rosteredCanceledByDepartment: { magic: 2, organizers: 2, partnerships: 0 },
					missingRoster: facility.id === "a" ? 1 : 0,
					missingRosterByDepartment: {
						magic: 0,
						organizers: facility.id === "a" ? 1 : 0,
						partnerships: 0,
					},
					incidentGames: 1,
					incidentGamesByDepartment: { magic: 0, organizers: 1, partnerships: 0 },
					organizers: facility.gamesByDepartment
						? [
								{
									id: "club",
									name: "Club",
									games: facility.gamesByDepartment.organizers,
									scheduled: facility.gamesByDepartment.organizers,
									uniquePlayerIds: facility.id === "a" ? ["p2"] : ["p3"],
									activatedPlayerIds: facility.id === "a" ? ["p2"] : ["p3"],
									almostFilled: 0,
									rosteredCanceled: 2,
									missingRoster: facility.id === "a" ? 1 : 0,
									incidentGames: 1,
								},
							]
						: [],
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
	if (value.startsWith("time:")) {
		fireEvent.click(screen.getByRole("combobox", { name: "Slice" }));
		fireEvent.click(screen.getByRole("option", { name: "Date" }));
		fireEvent.click(screen.getByRole("option", { name: value === "time:week" ? "Week" : "Month" }));
		return;
	}

	const labels = {
		registrations: "New users",
		"unique-users": "Active users",
		games: "Games played",
		"avg-daily-games": "Avg daily games",
		"active-organizers": "Active organizers",
		"active-facilities": "Active facilities",
		"scheduled-games": "Games scheduled",
		"confirmation-rate": "Confirmation rate",
		"unique-players": "Active players",
		"activated-players": "Activated players",
		"almost-filled-rate": "Almost-filled rate",
		"incident-games-rate": "Incident games",
		time: "Date",
		day: "Day",
		week: "Week",
		month: "Month",
		market: "Market",
		facility: "Facility",
		department: "Department",
		organizer: "Organizer",
		none: "None",
		"7d": "7D",
		"28d": "28D",
		"90d": "90D",
		"6m": "6M",
		"12m": "12M",
	};
	fireEvent.click(screen.getByRole("combobox", { name }));
	fireEvent.click(screen.getByRole("option", { name: labels[value as keyof typeof labels] }));
	if (value === "time") fireEvent.click(screen.getByRole("option", { name: "Day" }));
}
describe("MetricDrillDownPanel", () => {
	beforeEach(() => {
		timeView = undefined;
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
	it("selects an organizer slice and segments markets by organizer, excluding Magic", () => {
		setup();
		select("Slice", "organizer");
		expect(screen.getByRole("combobox", { name: "Segment" })).toBeDisabled();
		expect(screen.getByRole("button", { name: "Club: 5" })).toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", { name: "Club: 5" }));
		expect(setMetricFocus).toHaveBeenLastCalledWith({
			facilityIds: ["a", "b", "c"],
			department: "organizers",
		});
		select("Slice", "market");
		select("Segment", "organizer");
		const bar = screen.getByRole("button", { name: "Miami · Club: 4" });
		fireEvent.click(bar);
		expect(setMetricFocus).toHaveBeenLastCalledWith({
			facilityIds: ["a", "b"],
			department: "organizers",
		});
		expect(screen.getByText("4", { selector: "p" })).toBeInTheDocument();
		expect(screen.getAllByText("Club").length).toBeGreaterThan(0);
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
		fireEvent.click(screen.getByRole("button", { name: /Count/ }));
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
		expect(screen.getByRole("button", { name: /Count/ })).toHaveClass(
			"whitespace-nowrap",
			"inline-flex",
		);
		expect(navigate).not.toHaveBeenCalled();
	});

	it("lists the measures in order, each with a plain-language tooltip", () => {
		setup();
		fireEvent.click(screen.getByRole("combobox", { name: "Measure" }));
		const options = screen.getAllByRole("option");
		expect(options.map((option) => option.textContent)).toEqual([
			"Games played",
			"Avg daily games",
			"Games scheduled",
			"Incident games",
			"Confirmation rate",
			"Almost-filled rate",
			"New users",
			"Active users",
			"Activated players",
			"Active players",
			"Active organizers",
			"Active facilities",
		]);
		for (const option of options) expect(option.getAttribute("title")).toBeTruthy();
		expect(options[0]).toHaveAttribute("title", "Games that actually took place.");
		expect(screen.queryByRole("option", { name: "App sessions" })).not.toBeInTheDocument();
	});
	it("hides department slices for active organizers like active facilities", () => {
		setup();
		select("Measure", "active-organizers");
		fireEvent.click(screen.getByRole("combobox", { name: "Slice" }));
		expect(screen.queryByRole("option", { name: "Department" })).not.toBeInTheDocument();
		expect(screen.getByRole("option", { name: "Organizer" })).toBeInTheDocument();
		expect(screen.getByRole("combobox", { name: "Segment" })).toBeDisabled();
	});
	it("offers department slices for game and player measures and hides them for active facilities", () => {
		setup();
		select("Slice", "department");
		expect(screen.getByRole("combobox", { name: "Segment" })).toBeDisabled();
		expect(within(screen.getByRole("table")).getByText("Magic")).toBeInTheDocument();
		select("Measure", "scheduled-games");
		expect(screen.getByRole("combobox", { name: "Slice" })).toHaveTextContent("Department");
		expect(screen.getByRole("combobox", { name: "Measure" })).toHaveTextContent("Games scheduled");
		select("Measure", "confirmation-rate");
		expect(screen.getByRole("combobox", { name: "Measure" })).toHaveTextContent(
			"Confirmation rate",
		);
		expect(screen.getByRole("button", { name: /Rate/ })).toBeInTheDocument();
		select("Measure", "unique-players");
		expect(screen.getByRole("combobox", { name: "Measure" })).toHaveTextContent("Active players");
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
	it("shows almost-filled parts and reports missing rosters as data errors", () => {
		setup();
		select("Measure", "almost-filled-rate");
		expect(screen.getAllByText("25.0%")[0]).toHaveClass("text-3xl");
		expect(
			screen.getByText("3 almost-filled canceled games of 12 eligible canceled games"),
		).toBeInTheDocument();
		expect(screen.getByRole("alert")).toHaveTextContent(
			"Data error: 1 eligible canceled games have no payout row or player count.",
		);
		const miami = within(screen.getByRole("table")).getByRole("row", { name: /Miami/ });
		expect(miami).toHaveTextContent("2 of 8 · 1 data errors");
		expect(screen.getByRole("button", { name: "Orlando: 25.0% · 1 of 4" })).toBeInTheDocument();
		expect(screen.queryByText(/Reviews arrive after games/)).not.toBeInTheDocument();
		fireEvent.click(miami);
		expect(
			screen.getByText("2 almost-filled canceled games of 8 eligible canceled games"),
		).toBeInTheDocument();
		select("Slice", "facility");
		select("Segment", "department");
		fireEvent.click(screen.getByRole("button", { name: "Arena · Magic: 50.0%" }));
		expect(screen.queryByText(/almost-filled canceled games of/)).not.toBeInTheDocument();
	});
	it("shows the incident rate with the reviews-lag note and its parts", () => {
		setup();
		select("Measure", "incident-games-rate");
		expect(screen.getByRole("button", { name: /Rate/ })).toBeInTheDocument();
		expect(screen.getByText(/Reviews arrive after games/)).toBeInTheDocument();
		expect(screen.getByText("3 incident games of 16 happened games")).toBeInTheDocument();
		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
		select("Measure", "confirmation-rate");
		expect(screen.getByText("16 played games of 22 scheduled games")).toBeInTheDocument();
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
		fireEvent.click(screen.getByRole("button", { name: /Count/ }));
		expect(within(screen.getByRole("table")).getAllByRole("row")[1]).toHaveTextContent("Market 0");
		fireEvent.click(screen.getByRole("button", { name: /Count/ }));
		fireEvent.click(screen.getByRole("button", { name: "Market" }));
		expect(within(screen.getByRole("table")).getAllByRole("row")[1]).toHaveTextContent("Market 0");
		fireEvent.click(screen.getByRole("button", { name: "Market" }));
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
		expect(screen.getByTestId("drill-down-skeleton")).toBeInTheDocument();
		for (const name of ["Measure", "Slice", "Segment"]) {
			expect(screen.getByRole("combobox", { name })).toBeVisible();
			expect(screen.getByRole("combobox", { name }).querySelector(".truncate")).toBeNull();
		}
		expect(screen.queryByText(/1970/)).not.toBeInTheDocument();
		pending = false;
		failed = true;
		rerender(<MetricDrillDownPanel {...props} />);
		expect(screen.queryByTestId("drill-down-skeleton")).not.toBeInTheDocument();
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

describe("app activity measures", () => {
	beforeEach(() => {
		scope = { kind: "all" };
		period = "month";
		data = [facility];
		pending = false;
		failed = false;
		gameDepartments = [];
		showSupply = true;
		demandInputs.mockClear();
	});
	it.each(["registrations", "unique-users"])(
		"resets facility and department slices for %s",
		(measure) => {
			gameDepartments = ["magic"];
			setup();
			select("Slice", "facility");
			select("Segment", "department");
			select("Measure", measure);
			expect(screen.getByRole("combobox", { name: "Slice" })).toHaveTextContent("Market");
			expect(screen.queryByRole("combobox", { name: "Segment" })).not.toBeInTheDocument();
			expect(screen.getByText(/App activity isn’t linked/)).toHaveTextContent(
				"Department filters don’t apply.",
			);
			fireEvent.click(screen.getByRole("combobox", { name: "Slice" }));
			expect(screen.queryByRole("option", { name: "Facility" })).not.toBeInTheDocument();
			expect(screen.queryByRole("option", { name: "Department" })).not.toBeInTheDocument();
			fireEvent.keyDown(screen.getByRole("combobox", { name: "Slice" }), { key: "Escape" });
			select("Measure", "games");
			select("Slice", "department");
			select("Measure", measure);
			expect(screen.getByRole("combobox", { name: "Slice" })).toHaveTextContent("Market");
			expect(demandInputs).toHaveBeenLastCalledWith(
				expect.objectContaining({ departments: [], slice: "market" }),
			);
		},
	);
	it("loads app activity while supply is hidden and marks ranges spanning the source change", () => {
		showSupply = false;
		setup();
		select("Measure", "unique-users");
		expect(screen.queryByText(/Supply is hidden/)).not.toBeInTheDocument();
		expect(screen.queryByRole("note")).not.toBeInTheDocument();
		select("Date range", "6m");
		expect(screen.getByRole("note")).toHaveTextContent("June 29, 2026");
		select("Measure", "registrations");
		expect(screen.queryByRole("note")).not.toBeInTheDocument();
	});
	it("uses the facility’s market for app measures and keeps that slice on scope changes", () => {
		scope = { kind: "facility", id: "a", name: "Arena", marketName: "Miami" };
		data = [facility];
		const result = setup();
		select("Measure", "registrations");
		expect(demandInputs).toHaveBeenLastCalledWith(
			expect.objectContaining({ marketId: "miami", facilityId: undefined }),
		);
		scope = { kind: "market", id: "miami", name: "Miami" };
		result.rerender(<MetricDrillDownPanel {...result.props} />);
		expect(screen.getByRole("combobox", { name: "Slice" })).toHaveTextContent("Market");
	});
});

describe("time slices", () => {
	beforeEach(() => {
		scope = { kind: "all" };
		showSupply = true;
		pending = false;
		failed = false;
		gameDepartments = [];
		data = [facility];
		timeView = {
			measure: "games",
			range: "12m",
			kind: "count",
			start: "2026-06-28",
			end: "2026-10-07",
			total: 12,
			rows: Array.from({ length: 12 }, (_, index) => {
				const day = new Date("2026-06-28T00:00:00Z");
				day.setUTCDate(day.getUTCDate() + index);
				const id = day.toISOString().slice(0, 10);
				return {
					id,
					name: id,
					bucketStart: id,
					bucketEnd: id,
					partial: index === 0,
					value: index === 0 ? 12 : 0,
					departments: { magic: index === 0 ? 12 : 0, organizers: 0, partnerships: 0 },
					facilityIds: index === 0 ? ["a"] : [],
				};
			}),
		};
	});
	it("labels weeks by Sunday end dates and months by abbreviated month and year", () => {
		if (!timeView) throw new Error("Missing fixture");
		timeView = {
			...timeView,
			rows: [
				{
					...timeView.rows[0],
					value: 12,
					departments: null,
					id: "2026-09-07",
					name: "2026-09-07",
					bucketStart: "2026-09-10",
					bucketEnd: "2026-09-13",
					partial: true,
				},
			],
		};
		setup();
		select("Slice", "time:week");
		expect(screen.getByRole("button", { name: "Sep 13, 2026 · partial: 12" })).toBeInTheDocument();
		expect(
			within(screen.getByRole("table")).getByText("Sep 13, 2026 · partial"),
		).toBeInTheDocument();
		expect(screen.queryByText("Sep 7, 2026 · partial")).not.toBeInTheDocument();
		select("Slice", "time:month");
		expect(screen.getByRole("button", { name: "Sep 2026 · partial: 12" })).toBeInTheDocument();
		expect(within(screen.getByRole("table")).getByText("Sep 2026 · partial")).toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", { name: "Sep 2026 · partial: 12" }));
		expect(screen.getByText("Sep 2026 · partial", { selector: "p" })).toBeInTheDocument();
		select("Slice", "time");
		expect(screen.getByRole("button", { name: "Sep 7, 2026 · partial: 12" })).toBeInTheDocument();
	});

	it("shows every chronological bucket, partial labels, and a scrollable chart", () => {
		setup();
		select("Slice", "time");
		expect(demandInputs).toHaveBeenLastCalledWith(
			expect.objectContaining({ slice: "time", grain: "day" }),
		);
		expect(screen.getByRole("combobox", { name: "Slice" })).toHaveTextContent("Date · Day");
		expect(screen.queryByRole("combobox", { name: "Bucket" })).not.toBeInTheDocument();
		expect(screen.queryByText(/Showing the top/)).not.toBeInTheDocument();
		const chart = screen.getByRole("region", { name: "Metric by group" });
		expect(within(chart).getAllByRole("button")).toHaveLength(12);
		expect(within(chart).getAllByRole("button")[0]).toHaveAccessibleName(/Jun 28, 2026.*partial/);
		expect(chart.querySelector('[style*="min-width"]')).toHaveStyle({ minWidth: "504px" });
		expect(screen.queryByRole("button", { name: /View on map:/ })).not.toBeInTheDocument();
	});
	it("selects and clears buckets, filters Supply to their facility IDs, and resets on grain change", () => {
		setup();
		select("Slice", "time");
		const bar = screen.getByRole("button", { name: /Jun 28, 2026.*12/ });
		fireEvent.click(bar);
		expect(setMetricFocus).toHaveBeenLastCalledWith({ facilityIds: ["a"], department: undefined });
		expect(screen.getByRole("table").querySelectorAll("tbody tr")).toHaveLength(1);
		fireEvent.click(bar);
		expect(screen.getByRole("table").querySelectorAll("tbody tr")).toHaveLength(12);
		select("Slice", "time:week");
		expect(demandInputs).toHaveBeenLastCalledWith(expect.objectContaining({ grain: "week" }));
		select("Slice", "time:month");
		expect(demandInputs).toHaveBeenLastCalledWith(expect.objectContaining({ grain: "month" }));
		select("Segment", "department");
		expect(screen.getByRole("button", { name: /Jun 2026.*Magic.*12/ })).toBeInTheDocument();
	});
	it("keeps Time when switching to app measures and places the source marker on the timeline", () => {
		setup();
		select("Slice", "time");
		select("Measure", "registrations");
		expect(demandInputs).toHaveBeenLastCalledWith(
			expect.objectContaining({ slice: "time", grain: "day", departments: [] }),
		);
		expect(screen.queryByText("2026-06-29")).not.toBeInTheDocument();
		select("Measure", "unique-users");
		expect(screen.getByText("2026-06-29")).toBeInTheDocument();
	});
	it("shows rate components for segments and filters Supply to the segment's facilities", () => {
		if (!timeView) throw new Error("Missing fixture");
		timeView = {
			...timeView,
			kind: "rate",
			total: 25,
			numerator: 3,
			denominator: 12,
			rows: [
				{
					...timeView.rows[0],
					id: "2026-06-28",
					name: "2026-06-28",
					value: 25,
					departments: { magic: 50, organizers: null, partnerships: 0 },
					numerator: 3,
					denominator: 12,
					departmentParts: { magic: { numerator: 2, denominator: 4, dataErrors: 1 } },
					departmentFacilityIds: { magic: ["b"] },
				},
			],
		};
		setup();
		select("Measure", "almost-filled-rate");
		select("Slice", "time");
		select("Segment", "department");
		const bar = screen.getByRole("button", { name: /Jun 28, 2026.*Magic: 50.0%.*2 of 4/ });
		fireEvent.click(bar);
		expect(setMetricFocus).toHaveBeenLastCalledWith({ facilityIds: ["b"], department: "magic" });
		expect(
			screen.getByText("2 almost-filled canceled games of 4 eligible canceled games"),
		).toBeInTheDocument();
		expect(screen.getByRole("alert")).toHaveTextContent(/Data error: 1/);
	});
	it("explains ranges with no completed bucket and still displays zero count buckets", () => {
		if (!timeView) throw new Error("Missing fixture");
		timeView = { ...timeView, total: 0, rows: timeView.rows.map((row) => ({ ...row, value: 0 })) };
		const result = setup();
		select("Slice", "time");
		expect(screen.getByRole("region", { name: "Metric by group" })).toBeInTheDocument();
		timeView = { ...timeView, start: "2026-10-01", end: "2026-09-30", rows: [] };
		result.rerender(<MetricDrillDownPanel {...result.props} />);
		expect(screen.getByText("No completed buckets in this date range.")).toBeInTheDocument();
	});
});

describe("drill-down changes", () => {
	beforeEach(() => {
		scope = { kind: "all" };
		period = "month";
		showSupply = true;
		pending = false;
		failed = false;
		gameDepartments = [];
		data = [facility];
		comparisonView = {
			measure: "games",
			range: "28d",
			kind: "count",
			start: "2026-09-10",
			end: "2026-10-07",
			previousStart: "2026-08-13",
			previousEnd: "2026-09-09",
			total: 32,
			previousTotal: 30,
			rows: [
				{
					id: "up",
					name: "Up",
					value: 12,
					previousValue: 10,
					departments: { magic: 12, organizers: 0, partnerships: 0 },
					previousDepartments: { magic: 8, organizers: 0, partnerships: 0 },
				},
				{ id: "down", name: "Down", value: 0, previousValue: 10, departments: null },
				{ id: "stable", name: "Equal", value: 10, previousValue: 10, departments: null },
				{ id: "new", name: "New market", value: 10, previousValue: 0, departments: null },
				{ id: "missing", name: "Missing", value: null, previousValue: null, departments: null },
				{ id: "empty", name: "Empty region", value: 0, previousValue: 0, departments: null },
			],
		};
	});
	afterEach(() => {
		comparisonView = undefined;
	});
	it("uses consistent rounding, colors and sorting with new and missing last", () => {
		setup();
		expect(screen.getByTestId("drill-down-headline-change")).toHaveTextContent("↑ 6.7% (+2)");
		expect(screen.getByText("↑ 20%")).toHaveClass("text-pleiful-pitch-green-50");
		expect(screen.getByText("↑ 20%").parentElement).toHaveClass("text-foreground");
		expect(
			within(screen.getByText("↑ 20%").parentElement as HTMLElement).getByText("(+2)"),
		).not.toHaveAttribute("style");
		expect(screen.getByText("↓ 100%")).toHaveStyle({ color: "#EF4444" });
		expect(screen.getByText("↓ 100%").parentElement).toHaveClass("text-foreground");
		expect(screen.getByText("(-10)")).not.toHaveAttribute("style");
		expect(screen.getByText("Stable").parentElement).toHaveTextContent("Stable (+0)");
		expect(screen.getByText("↑ New")).toBeInTheDocument();
		expect(screen.queryByText("Empty region")).not.toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", { name: "Change" }));
		const names = () =>
			within(screen.getByRole("table"))
				.getAllByRole("row")
				.slice(1)
				.map((row) => row.querySelector("td")?.textContent);
		expect(names()).toEqual(["Up", "Equal", "Down", "Missing", "New market"]);
		fireEvent.click(screen.getByRole("button", { name: "Change ↓" }));
		expect(names()).toEqual(["Down", "Equal", "Up", "Missing", "New market"]);
		fireEvent.click(screen.getByText("Up", { selector: "td" }));
		expect(screen.getByTestId("drill-down-headline-change")).toHaveTextContent("↑ 20% (+2)");
		expect(within(screen.getByRole("table")).getByText("↑ 20%").parentElement).toHaveTextContent(
			"↑ 20% (+2)",
		);
	});
	it("compares the selected department against its own prior value", () => {
		setup();
		select("Segment", "department");
		fireEvent.click(screen.getByRole("button", { name: "Up · Magic: 12" }));
		expect(screen.getByTestId("drill-down-headline-change")).toHaveTextContent("↑ 50% (+4)");
		expect(within(screen.getByRole("table")).getByText("↑ 50%").parentElement).toHaveTextContent(
			"↑ 50% (+4)",
		);
	});
	it("shows Stable and zero change without an arrow in the headline and table", () => {
		setup();
		fireEvent.click(screen.getByText("Equal", { selector: "td" }));
		expect(screen.getByTestId("drill-down-headline-change")).toHaveTextContent("Stable (+0)");
		expect(screen.getByTestId("drill-down-headline-change").querySelector("img")).toBeNull();
		expect(within(screen.getByRole("table")).getByText("Stable").parentElement).toHaveTextContent(
			"Stable (+0)",
		);
	});
	it("shows the absolute decrease in the selected headline", () => {
		setup();
		fireEvent.click(screen.getByText("Down", { selector: "td" }));
		expect(screen.getByTestId("drill-down-headline-change")).toHaveTextContent("↓ 100% (-10)");
		expect(
			within(screen.getByTestId("drill-down-headline-change")).getByText("↓ 100%"),
		).toHaveStyle({ color: "#EF4444" });
	});
	it("shows new activity with its raw difference", () => {
		setup();
		fireEvent.click(screen.getByText("New market", { selector: "td" }));
		expect(screen.getByTestId("drill-down-headline-change")).toHaveTextContent("↑ New (+10)");
	});
	it("shows signed raw changes for distinct counts", () => {
		if (!comparisonView) throw new Error("Missing fixture");
		comparisonView = { ...comparisonView, kind: "distinct-count", total: 2, previousTotal: 1 };
		setup();
		select("Measure", "unique-players");
		expect(screen.getByTestId("drill-down-headline-change")).toHaveTextContent("↑ 100% (+1)");
	});
	it("changes comparison independently from sorting and range", () => {
		setup();
		const compare = screen.getByRole("combobox", { name: "Compare" });
		expect(compare).toHaveTextContent("MoM");
		expect(compare).toHaveAttribute("title", expect.stringContaining("Month over month"));
		expect(compare.closest("fieldset")?.parentElement).toBe(
			screen.getByRole("combobox", { name: "Date range" }).closest("fieldset")?.parentElement,
		);
		fireEvent.click(screen.getByRole("button", { name: "Change" }));
		fireEvent.click(screen.getByRole("combobox", { name: "Compare" }));
		expect(screen.getByRole("option", { name: "YoY" })).toHaveAttribute("title", "Year over year");
		expect(screen.getByRole("option", { name: "MoM" })).toHaveAttribute(
			"title",
			"Month over month",
		);
		expect(screen.getByRole("option", { name: "WoW" })).toHaveAttribute("title", "Week over week");
		fireEvent.click(screen.getByRole("option", { name: "YoY" }));
		expect(comparisonInputs).toHaveBeenLastCalledWith(
			expect.objectContaining({ range: "28d", comparison: "year" }),
		);
		expect(screen.getByTestId("drill-down-headline-change")).toHaveClass("font-normal");
		expect(compare).toHaveTextContent("YoY");
		expect(compare).toHaveAttribute("title", expect.stringContaining("Year over year"));
		expect(screen.getByRole("button", { name: "Change ↓" }).closest("th")).toHaveAttribute(
			"aria-sort",
			"descending",
		);
		fireEvent.click(screen.getByRole("combobox", { name: "Compare" }));
		fireEvent.click(screen.getByRole("option", { name: "WoW" }));
		expect(comparisonInputs).toHaveBeenLastCalledWith(
			expect.objectContaining({ range: "28d", comparison: "week" }),
		);
		expect(compare).toHaveTextContent("WoW");
		select("Slice", "time");
		expect(screen.queryByRole("combobox", { name: "Compare" })).not.toBeInTheDocument();
	});
	it("uses points for rates and keeps unavailable comparisons unavailable", () => {
		if (!comparisonView) throw new Error("Missing fixture");
		comparisonView = {
			...comparisonView,
			kind: "rate",
			total: 82.1,
			previousTotal: 80,
			rows: [
				{ id: "a", name: "Arena", value: 82.1, previousValue: 80, departments: null },
				{
					id: "b",
					name: "No prior denominator",
					value: 20,
					previousValue: null,
					departments: null,
				},
			],
		};
		setup();
		expect(screen.getAllByText("↑ 2.1 pts")).toHaveLength(2);
	});
	it("shows the source-switch note when the previous app window crosses the transition", () => {
		if (!comparisonView) throw new Error("Missing fixture");
		comparisonView = { ...comparisonView, previousStart: "2026-06-28", previousEnd: "2026-07-25" };
		setup();
		select("Measure", "unique-users");
		expect(screen.getByRole("note")).toHaveTextContent("Tracking source changed");
	});
});
