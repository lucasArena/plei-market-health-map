import { render, screen } from "@testing-library/react";
import { FacilitiesMapScreen } from "@/presentation/screens/FacilitiesMapScreen/FacilitiesMapScreenComponent";
import { SESSION_HEATMAP_BUCKET_COLORS } from "@/presentation/screens/FacilitiesMapScreen/FacilitiesMapScreenComponent.styles";
import { EN_MESSAGES } from "@/test/messages";

const mockRules = vi.fn();

vi.mock("maplibre-gl/dist/maplibre-gl.css", () => ({}));
vi.mock("@/presentation/components/map/FacilityDetailPanel/FacilityDetailPanelComponent", () => ({
	FacilityDetailPanel: ({ facilityId, isClosing }: { facilityId: string; isClosing: boolean }) => (
		<aside data-testid="detail-panel" data-closing={isClosing}>
			{facilityId}
		</aside>
	),
}));
vi.mock("@/presentation/screens/FacilitiesMapScreen/FacilitiesMapScreenComponent.rules", () => ({
	useFacilitiesMapScreenRules: () => mockRules(),
}));

const FACILITY = {
	id: "f1",
	marketId: "austin",
	name: "Eastside Futsal Arena",
	avatarUrl: null,
	isActive: true,
	location: { latitude: 30.27, longitude: -97.74 },
};

function rulesWith(status: string, overrides: object = {}) {
	return {
		closePanel: vi.fn(),
		containerRef: { current: null },
		hasSessionHeatmap: false,
		handlePanelClosed: vi.fn(),
		hovered: null,
		isPanelClosing: false,
		selectedFacilityId: null,
		messages: EN_MESSAGES.map,
		sessionScale: { low: 0, high: 0 },
		status,
		...overrides,
	};
}

describe("FacilitiesMapScreen", () => {
	it("renders only the map and its attribution", () => {
		mockRules.mockReturnValue(rulesWith("ready"));

		render(<FacilitiesMapScreen />);

		expect(screen.getByRole("region", { name: "Facilities map" })).toBeInTheDocument();
		expect(screen.getByTestId("facilities-map")).toBeInTheDocument();
		expect(screen.queryByRole("status")).not.toBeInTheDocument();
		expect(screen.queryByTestId("session-heatmap-legend")).not.toBeInTheDocument();
		expect(screen.queryByTestId("detail-panel")).not.toBeInTheDocument();
		expect(screen.getByRole("link", { name: "OpenStreetMap contributors" })).toHaveAttribute(
			"href",
			"https://www.openstreetmap.org/copyright",
		);
	});

	it("shows the session heatmap legend when heatmap data is present", () => {
		mockRules.mockReturnValue(
			rulesWith("ready", {
				hasSessionHeatmap: true,
				sessionScale: { low: 12, high: 480 },
			}),
		);

		render(<FacilitiesMapScreen />);

		const legend = screen.getByTestId("session-heatmap-legend");
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
		mockRules.mockReturnValue(rulesWith("ready", { hasSessionHeatmap: true }));

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
});
