import { render, screen } from "@testing-library/react";
import { EN_MESSAGES } from "@/application/test/messages";
import { useHeaderSlot } from "@/presentation/components/providers/HeaderSlotProvider/HeaderSlotProviderComponent";
import { FacilitiesMapScreen } from "@/presentation/screens/FacilitiesMapScreen/FacilitiesMapScreenComponent";
import { SESSION_HEATMAP_BUCKET_COLORS } from "@/presentation/screens/FacilitiesMapScreen/FacilitiesMapScreenComponent.styles";

const mockRules = vi.fn();

vi.mock(
	"@/presentation/components/providers/HeaderSlotProvider/HeaderSlotProviderComponent",
	() => ({
		useHeaderSlot: vi.fn(() => ({ searchSlot: null, setSearchSlot: vi.fn() })),
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

function rulesWith(status: string, overrides: object = {}) {
	return {
		clearSearchScope: vi.fn(),
		closePanel: vi.fn(),
		containerRef: { current: null },
		facilities: [],
		hasDemandHeatmap: false,
		heatmapCopy: {
			legend: EN_MESSAGES.map.sessionHeatmapLegend,
			context: EN_MESSAGES.map.sessionHeatmapContext,
			noActivity: EN_MESSAGES.map.sessionHeatmapNoActivity,
			lowValue: EN_MESSAGES.map.sessionHeatmapLowValue,
			highValue: EN_MESSAGES.map.sessionHeatmapHighValue,
		},
		heatmapScale: { low: 0, high: 0 },
		handlePanelClosed: vi.fn(),
		hovered: null,
		isPanelClosing: false,
		selectedFacilityId: null,
		selectSearchFacility: vi.fn(),
		selectSearchMarket: vi.fn(),
		messages: EN_MESSAGES.map,
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
		vi.mocked(useHeaderSlot).mockReturnValue({ searchSlot: slot, setSearchSlot: vi.fn() });
		render(<FacilitiesMapScreen />);

		expect(slot).toContainElement(
			screen.getByRole("combobox", { name: "Search markets or facilities" }),
		);
		vi.mocked(useHeaderSlot).mockReturnValue({ searchSlot: null, setSearchSlot: vi.fn() });
		slot.remove();
	});

	it("renders only the map and its attribution", () => {
		mockRules.mockReturnValue(rulesWith("ready"));

		render(<FacilitiesMapScreen />);

		expect(screen.getByRole("region", { name: "Facilities map" })).toBeInTheDocument();
		expect(screen.getByTestId("facilities-map")).toBeInTheDocument();
		expect(screen.queryByRole("status")).not.toBeInTheDocument();
		expect(screen.queryByTestId("demand-heatmap-legend")).not.toBeInTheDocument();
		expect(screen.queryByTestId("detail-panel")).not.toBeInTheDocument();
		expect(screen.getByRole("link", { name: "OpenStreetMap contributors" })).toHaveAttribute(
			"href",
			"https://www.openstreetmap.org/copyright",
		);
	});

	it("shows the session heatmap legend when heatmap data is present", () => {
		mockRules.mockReturnValue(
			rulesWith("ready", {
				hasDemandHeatmap: true,
				heatmapScale: { low: 12, high: 480 },
			}),
		);

		render(<FacilitiesMapScreen />);

		const legend = screen.getByTestId("demand-heatmap-legend");
		expect(legend).toHaveTextContent("Sessions per shaded area · last 28 days");
		expect(legend).toHaveTextContent("Scale updates for the current map view");
		expect(legend).toHaveTextContent("12");
		expect(legend).toHaveTextContent("480+");
		expect(screen.getByText("12 sessions in a shaded area")).toBeInTheDocument();
		expect(screen.getByText("480+ sessions in a shaded area")).toBeInTheDocument();
		expect(screen.getByTestId("session-heatmap-gradient")).toHaveStyle({
			backgroundImage: `linear-gradient(to right, ${SESSION_HEATMAP_BUCKET_COLORS.join(", ")})`,
		});
		expect(SESSION_HEATMAP_BUCKET_COLORS).toEqual(["#E0F2FE", "#7DD3FC", "#0EA5E9", "#7C3AED"]);
	});

	it("explains when the current map view has no sessions", () => {
		mockRules.mockReturnValue(rulesWith("ready", { hasDemandHeatmap: true }));

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
					x: 100,
					y: 50,
					flipX: false,
					flipY: false,
				},
			}),
		);

		render(<FacilitiesMapScreen />);

		expect(screen.getByRole("tooltip")).toHaveTextContent("Eastside Futsal Arena");
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

	it("places the feedback button bottom left and moves the legend beside it", () => {
		mockRules.mockReturnValue(
			rulesWith("ready", {
				hasDemandHeatmap: true,
				selectedFacilityId: "f1",
				heatmapScale: { low: 1, high: 10 },
			}),
		);

		render(<FacilitiesMapScreen />);

		expect(screen.getByTestId("feedback-widget")).toHaveAttribute("data-facility", "f1");
		const legend = screen.getByTestId("demand-heatmap-legend");
		expect(legend).toHaveClass("bottom-8", "left-16");
		expect(legend).not.toHaveClass("left-3");
	});
});
