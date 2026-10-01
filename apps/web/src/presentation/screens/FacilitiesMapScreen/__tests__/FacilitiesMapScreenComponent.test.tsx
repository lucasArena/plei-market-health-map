import { render, screen } from "@testing-library/react";
import { EN_MESSAGES } from "@/application/test/messages";
import { useHeaderSlot } from "@/presentation/components/providers/HeaderSlotProvider/HeaderSlotProviderComponent";
import { FacilitiesMapScreen } from "@/presentation/screens/FacilitiesMapScreen/FacilitiesMapScreenComponent";
import { SESSION_HEATMAP_BUCKET_COLORS } from "@/presentation/screens/FacilitiesMapScreen/FacilitiesMapScreenComponent.styles";

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
		sessionScale: { low: 0, high: 0 },
		status,
		...overrides,
	};
}

describe("FacilitiesMapScreen", () => {
	it("renders the search into the header slot once the header provides it", () => {
		mockRules.mockReturnValue(rulesWith("ready"));
		const { unmount } = render(<FacilitiesMapScreen />);
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
		render(<FacilitiesMapScreen />);

		expect(slot).toContainElement(
			screen.getByRole("combobox", { name: "Search markets or facilities" }),
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

		render(<FacilitiesMapScreen />);

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
			}),
		);

		render(<FacilitiesMapScreen />);

		const legend = screen.getByTestId("session-heatmap-legend");
		expect(slot).toContainElement(legend);
		expect(legend).toHaveTextContent("Sessions per shaded area · last 28 days");
		expect(legend).toHaveTextContent("Scale updates for the current map view");
		expect(screen.getByText("Scale updates for the current map view")).toHaveClass("text-[10px]");
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

		render(<FacilitiesMapScreen />);

		expect(screen.getByText("No sessions in the current map view")).toBeInTheDocument();
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

		render(<FacilitiesMapScreen />);

		const card = screen.getByRole("tooltip");
		expect(card).toHaveTextContent("Eastside Futsal Arena");
		expect(card).toHaveStyle({ transform: "translate(-50%, -100%)" });
		expect(screen.getByTestId("cluster-hover-surface")).toHaveClass("map-glass", "py-1.5");
	});

	it("keeps the map mounted when nothing is hovered", () => {
		mockRules.mockReturnValue(rulesWith("ready", { hovered: null }));

		render(<FacilitiesMapScreen />);

		expect(screen.getByTestId("facilities-map")).toBeInTheDocument();
		expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
	});

	it.each([
		["loading", EN_MESSAGES.map.loading],
		["error", EN_MESSAGES.map.failed],
	])("shows the %s overlay", (status, text) => {
		mockRules.mockReturnValue(rulesWith(status));

		render(<FacilitiesMapScreen />);

		expect(screen.getByRole("status")).toHaveTextContent(text);
	});

	it("shows the detail panel for the selected facility", () => {
		mockRules.mockReturnValue(
			rulesWith("ready", { selectedFacilityId: "f1", isPanelClosing: true }),
		);

		render(<FacilitiesMapScreen />);

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
			}),
		);

		render(<FacilitiesMapScreen />);

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
		const { rerender } = render(<FacilitiesMapScreen />);
		expect(screen.getByTestId("session-heatmap-legend")).toHaveClass("session-legend-in");

		exiting = true;
		rerender(<FacilitiesMapScreen />);
		expect(screen.getByTestId("session-heatmap-legend")).toHaveClass("session-legend-out");

		shown = false;
		rerender(<FacilitiesMapScreen />);
		expect(screen.queryByTestId("session-heatmap-legend")).not.toBeInTheDocument();
	});
});
