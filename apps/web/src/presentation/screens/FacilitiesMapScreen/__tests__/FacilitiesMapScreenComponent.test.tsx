import { act, fireEvent, screen } from "@testing-library/react";
import { EN_MESSAGES } from "@/application/test/messages";
import { renderWithMessages } from "@/application/test/render-with-messages";
import { useHeaderSlot } from "@/presentation/components/providers/HeaderSlotProvider/HeaderSlotProviderComponent";
import { FacilitiesMapScreen } from "@/presentation/screens/FacilitiesMapScreen/FacilitiesMapScreenComponent";
import { SESSION_HEATMAP_BUCKET_COLORS } from "@/presentation/screens/FacilitiesMapScreen/FacilitiesMapScreenComponent.styles";

const mockPrefetchQuery = vi.fn().mockResolvedValue(undefined);

vi.mock("@tanstack/react-query", async (importOriginal) => ({
	...(await importOriginal<typeof import("@tanstack/react-query")>()),
	useQueryClient: () => ({ prefetchQuery: mockPrefetchQuery }),
}));

const mockRules = vi.fn();

vi.mock(
	"@/presentation/components/providers/HeaderSlotProvider/HeaderSlotProviderComponent",
	() => ({
		useHeaderSlot: vi.fn(() => ({
			searchSlot: null,
			setSearchSlot: vi.fn(),
			legendSlot: null,
			setLegendSlot: vi.fn(),
		})),
	}),
);

vi.mock("maplibre-gl/dist/maplibre-gl.css", () => ({}));
vi.mock("@/presentation/components/map/FacilityDetailPanel/FacilityDetailPanelComponent", () => ({
	FacilityDetailPanel: ({ facilityId, isClosing }: { facilityId: string; isClosing: boolean }) => (
		<aside data-testid="detail-panel" data-closing={isClosing}>
			{facilityId}
		</aside>
	),
}));
vi.mock("@/presentation/components/feedbacks/Feedback/FeedbackComponent", () => ({
	Feedback: ({ facilityId }: { facilityId: string | null }) => (
		<button type="button" data-testid="feedback-widget" data-facility={facilityId ?? ""}>
			?
		</button>
	),
}));
vi.mock("@/presentation/screens/FacilitiesMapScreen/FacilitiesMapScreenComponent.rules", () => ({
	useFacilitiesMapScreenRules: () => mockRules(),
}));

const FACILITY = {
	id: "f1",
	marketId: "austin",
	marketName: "Austin",
	name: "Eastside Futsal Arena",
	avatarUrl: null,
	isActive: true,
	location: { latitude: 30.27, longitude: -97.74 },
};

function mountLegendSlot() {
	const slot = document.createElement("div");
	document.body.append(slot);
	vi.mocked(useHeaderSlot).mockReturnValue({
		searchSlot: null,
		setSearchSlot: vi.fn(),
		legendSlot: slot,
		setLegendSlot: vi.fn(),
	});
	return slot;
}

function rulesWith(status: string, overrides: object = {}) {
	return {
		clearSearchScope: vi.fn(),
		closePanel: vi.fn(),
		containerRef: { current: null },
		facilities: [],
		sessionHeatmapLegend: "App session density · last week",
		finishLegendMotion: vi.fn(),
		hasSessionHeatmap: false,
		handlePanelClosed: vi.fn(),
		hovered: null,
		isLegendShown: false,
		isPanelClosing: false,
		legendMotionClass: "",
		selectedFacilityId: null,
		selectSearchFacility: vi.fn(),
		selectSearchMarket: vi.fn(),
		messages: EN_MESSAGES.map,
		sessionFilterChips: [],
		sessionFilterSummary: "",
		sessionQueryStatus: "",
		sessionQueryFailed: false,
		retrySessionHeatmap: vi.fn(),
		canRemoveSessionFilters: true,
		removeSessionFilter: vi.fn(),
		sessionScale: { low: 0, high: 0 },
		sessionLegendState: "empty",
		shownFacilities: [],
		status,
		...overrides,
	};
}

describe("FacilitiesMapScreen", () => {
	it("renders the search into the header slot once the header provides it", () => {
		mockRules.mockReturnValue(rulesWith("ready"));
		const { unmount } = renderWithMessages(<FacilitiesMapScreen />);
		expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
		unmount();

		const slot = document.createElement("div");
		document.body.append(slot);
		vi.mocked(useHeaderSlot).mockReturnValue({
			searchSlot: slot,
			setSearchSlot: vi.fn(),
			legendSlot: null,
			setLegendSlot: vi.fn(),
		});
		renderWithMessages(<FacilitiesMapScreen />);

		expect(slot).toContainElement(
			screen.getByRole("combobox", { name: "Search markets, facilities or cities" }),
		);
		vi.mocked(useHeaderSlot).mockReturnValue({
			searchSlot: null,
			setSearchSlot: vi.fn(),
			legendSlot: null,
			setLegendSlot: vi.fn(),
		});
		slot.remove();
	});

	it("renders only the map, without an attribution line", () => {
		mockRules.mockReturnValue(rulesWith("ready"));

		renderWithMessages(<FacilitiesMapScreen />);

		expect(screen.getByRole("region", { name: "Facilities map" })).toBeInTheDocument();
		expect(screen.getByTestId("facilities-map")).toHaveClass("map-frame");
		expect(screen.queryByRole("status")).not.toBeInTheDocument();
		expect(screen.queryByTestId("session-heatmap-legend")).not.toBeInTheDocument();
		expect(screen.queryByTestId("detail-panel")).not.toBeInTheDocument();
		expect(screen.queryByRole("link")).not.toBeInTheDocument();
	});

	it("shows the session heatmap legend when heatmap data is present", () => {
		const slot = mountLegendSlot();
		mockRules.mockReturnValue(
			rulesWith("ready", {
				hasSessionHeatmap: true,
				isLegendShown: true,
				legendMotionClass: "session-legend-in",
				sessionScale: { low: 12, high: 480 },
				sessionLegendState: "scale",
			}),
		);

		renderWithMessages(<FacilitiesMapScreen />);

		const legend = screen.getByTestId("session-heatmap-legend");
		expect(slot).toContainElement(legend);
		expect(legend).toHaveTextContent("App session density · last week");
		expect(legend).toHaveTextContent("All players · scale follows the map view");
		expect(screen.getByText("All players · scale follows the map view")).toHaveClass("text-[10px]");
		expect(legend).toHaveTextContent("12");
		expect(legend).toHaveTextContent("246");
		expect(legend).toHaveTextContent("480+");
		expect(screen.getByText("12 sessions in a shaded area")).toBeInTheDocument();
		expect(screen.getByText("246 sessions in a shaded area")).toBeInTheDocument();
		expect(screen.getByText("480+ sessions in a shaded area")).toBeInTheDocument();
		expect(screen.getByText("246")).toHaveClass("left-1/2", "-translate-x-1/2");
		const gradient = screen.getByTestId("session-heatmap-gradient");
		expect(gradient).toHaveClass("w-full");
		expect(gradient.parentElement).toHaveClass("flex-col");
		expect(gradient).toHaveStyle({
			backgroundImage: `linear-gradient(to right, ${SESSION_HEATMAP_BUCKET_COLORS.join(", ")})`,
		});
		expect(SESSION_HEATMAP_BUCKET_COLORS).toEqual(["#7DD3FC", "#0080FF", "#7C3AED"]);
	});

	it("explains when the current map view has no sessions", () => {
		mockRules.mockReturnValue(rulesWith("ready", { hasSessionHeatmap: true, isLegendShown: true }));

		renderWithMessages(<FacilitiesMapScreen />);

		expect(screen.getByText("No sessions in the current map view")).toBeInTheDocument();
		expect(screen.queryByTestId("session-heatmap-gradient")).not.toBeInTheDocument();
		expect(screen.queryByRole("button", { name: "Retry" })).not.toBeInTheDocument();
	});

	it("expands the legend filters when they overflow a single line", () => {
		let notify: ResizeObserverCallback = () => undefined;
		vi.stubGlobal(
			"ResizeObserver",
			class {
				constructor(callback: ResizeObserverCallback) {
					notify = callback;
				}
				observe() {
					notify([] as unknown as ResizeObserverEntry[], this as unknown as ResizeObserver);
				}
				unobserve() {}
				disconnect() {}
			},
		);
		const scrollWidth = vi
			.spyOn(HTMLElement.prototype, "scrollWidth", "get")
			.mockImplementation(function (this: HTMLElement) {
				return this.dataset.testid === "session-legend-filters" ? 240 : 0;
			});
		const clientWidth = vi
			.spyOn(HTMLElement.prototype, "clientWidth", "get")
			.mockImplementation(function (this: HTMLElement) {
				return this.dataset.testid === "session-legend-filters" ? 160 : 0;
			});
		mountLegendSlot();
		mockRules.mockReturnValue(
			rulesWith("ready", {
				hasSessionHeatmap: true,
				isLegendShown: true,
				sessionScale: { low: 1, high: 10 },
				sessionFilterChips: [
					{ field: "gender", id: "female", label: "Female" },
					{ field: "gender", id: "male", label: "Male" },
					{ field: "skill", id: "beginner", label: "Beginner" },
					{ field: "age", id: "age", label: "18–64" },
				],
				sessionFilterSummary: "Female · Male · Beginner · 18–64",
				canRemoveSessionFilters: true,
				removeSessionFilter: vi.fn(),
			}),
		);

		renderWithMessages(<FacilitiesMapScreen />);
		const row = screen.getByTestId("session-legend-filters");
		act(() => {
			notify([] as unknown as ResizeObserverEntry[], {} as ResizeObserver);
		});

		const expand = screen.getByRole("button", { name: "Show all filters" });
		expect(row).toHaveClass("flex-nowrap", "overflow-hidden");
		fireEvent.click(expand);
		expect(screen.getByRole("button", { name: "Show fewer filters" })).toBeInTheDocument();
		expect(row).toHaveClass("flex-wrap");
		expect(row).not.toHaveClass("overflow-hidden");
		scrollWidth.mockRestore();
		clientWidth.mockRestore();
		vi.unstubAllGlobals();
	});

	it("measures legend filter overflow when ResizeObserver is unavailable", () => {
		vi.stubGlobal("ResizeObserver", undefined);
		const scrollWidth = vi
			.spyOn(HTMLElement.prototype, "scrollWidth", "get")
			.mockImplementation(function (this: HTMLElement) {
				return this.dataset.testid === "session-legend-filters" ? 240 : 0;
			});
		const clientWidth = vi
			.spyOn(HTMLElement.prototype, "clientWidth", "get")
			.mockImplementation(function (this: HTMLElement) {
				return this.dataset.testid === "session-legend-filters" ? 160 : 0;
			});
		mountLegendSlot();
		mockRules.mockReturnValue(
			rulesWith("ready", {
				hasSessionHeatmap: true,
				isLegendShown: true,
				sessionScale: { low: 1, high: 10 },
				sessionFilterChips: [
					{ field: "gender", id: "female", label: "Female" },
					{ field: "gender", id: "male", label: "Male" },
				],
				canRemoveSessionFilters: true,
				removeSessionFilter: vi.fn(),
			}),
		);
		renderWithMessages(<FacilitiesMapScreen />);
		expect(screen.getByRole("button", { name: "Show all filters" })).toBeInTheDocument();
		scrollWidth.mockRestore();
		clientWidth.mockRestore();
		vi.unstubAllGlobals();
	});

	it("removes a filter chip from the session reference panel", () => {
		const removeSessionFilter = vi.fn();
		mountLegendSlot();
		mockRules.mockReturnValue(
			rulesWith("ready", {
				hasSessionHeatmap: true,
				isLegendShown: true,
				sessionScale: { low: 1, high: 10 },
				sessionFilterChips: [{ field: "gender", id: "female", label: "Female" }],
				canRemoveSessionFilters: true,
				removeSessionFilter,
			}),
		);
		renderWithMessages(<FacilitiesMapScreen />);
		fireEvent.click(screen.getByRole("button", { name: "Remove Female filter" }));
		expect(removeSessionFilter).toHaveBeenCalledWith("gender", "female");
	});

	it("shows a loading state instead of an empty legend while sessions load", () => {
		mountLegendSlot();
		mockRules.mockReturnValue(
			rulesWith("ready", { isLegendShown: true, sessionLegendState: "loading" }),
		);

		renderWithMessages(<FacilitiesMapScreen />);

		expect(screen.getByRole("status")).toHaveTextContent("Loading app sessions…");
		expect(screen.getByTestId("session-heatmap-loading")).toHaveClass("motion-safe:animate-pulse");
		expect(screen.getByTestId("session-heatmap-loading")).toHaveStyle({
			backgroundImage: `linear-gradient(to right, ${SESSION_HEATMAP_BUCKET_COLORS.join(", ")})`,
		});
		expect(screen.queryByText("No sessions in the current map view")).not.toBeInTheDocument();
		expect(screen.queryByTestId("session-heatmap-gradient")).not.toBeInTheDocument();
	});

	it("shows the hover card for the hovered facility", () => {
		mockRules.mockReturnValue(
			rulesWith("ready", {
				hovered: {
					kind: "facility",
					facility: FACILITY,
					x: 640,
					y: 420,
					flipX: false,
					flipY: false,
					viewport: { width: 1280, height: 800 },
				},
			}),
		);

		renderWithMessages(<FacilitiesMapScreen />);

		const card = screen.getByRole("tooltip");
		expect(card).toHaveTextContent("Eastside Futsal Arena");
		expect(card).toHaveStyle({ transform: "translate(-50%, -100%)" });
		expect(screen.getByTestId("cluster-hover-surface")).toHaveClass("map-glass", "py-1.5");
	});

	it("keeps the map mounted when nothing is hovered", () => {
		mockRules.mockReturnValue(rulesWith("ready", { hovered: null }));

		renderWithMessages(<FacilitiesMapScreen />);

		expect(screen.getByTestId("facilities-map")).toBeInTheDocument();
		expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
	});

	it.each([
		["loading", EN_MESSAGES.map.loading],
		["error", EN_MESSAGES.map.failed],
	])("shows the %s overlay", (status, text) => {
		mockRules.mockReturnValue(rulesWith(status));

		renderWithMessages(<FacilitiesMapScreen />);

		expect(screen.getByRole("status")).toHaveTextContent(text);
	});

	it("shows the detail panel for the selected facility", () => {
		mockRules.mockReturnValue(
			rulesWith("ready", { selectedFacilityId: "f1", isPanelClosing: true }),
		);

		renderWithMessages(<FacilitiesMapScreen />);

		expect(screen.getByTestId("detail-panel")).toHaveTextContent("f1");
		expect(screen.getByTestId("detail-panel")).toHaveAttribute("data-closing", "true");
	});

	it("places the session scale 8px above the account control", () => {
		const slot = mountLegendSlot();
		mockRules.mockReturnValue(
			rulesWith("ready", {
				hasSessionHeatmap: true,
				isLegendShown: true,
				legendMotionClass: "session-legend-in",
				selectedFacilityId: "f1",
				sessionScale: { low: 1, high: 10 },
				sessionLegendState: "scale",
			}),
		);

		renderWithMessages(<FacilitiesMapScreen />);

		expect(screen.queryByTestId("feedback-widget")).not.toBeInTheDocument();
		const legend = screen.getByTestId("session-heatmap-legend");
		expect(slot).toContainElement(legend);
		expect(legend).toHaveClass(
			"map-glass",
			"rounded-[var(--map-radius)]",
			"shadow-[var(--map-shadow)]",
			"session-legend-in",
		);
		expect(legend).not.toHaveClass(
			"absolute",
			"left-[var(--map-frame)]",
			"bottom-[calc(var(--map-profile-bottom)+var(--map-profile-size)+var(--map-profile-legend-gap))]",
		);
	});

	it("slides the session legend out before removing it", () => {
		mountLegendSlot();
		let exiting = false;
		let shown = true;
		mockRules.mockImplementation(() =>
			rulesWith("ready", {
				isLegendShown: shown,
				legendMotionClass: exiting ? "session-legend-out" : "session-legend-in",
				sessionScale: { low: 1, high: 4 },
			}),
		);
		const { rerender } = renderWithMessages(<FacilitiesMapScreen />);
		expect(screen.getByTestId("session-heatmap-legend")).toHaveClass("session-legend-in");

		exiting = true;
		rerender(<FacilitiesMapScreen />);
		expect(screen.getByTestId("session-heatmap-legend")).toHaveClass("session-legend-out");

		shown = false;
		rerender(<FacilitiesMapScreen />);
		expect(screen.queryByTestId("session-heatmap-legend")).not.toBeInTheDocument();
	});
});
