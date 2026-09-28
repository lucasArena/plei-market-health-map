import { fireEvent, render, screen } from "@testing-library/react";
import { FacilitiesMap } from "@/components/map/FacilitiesMap/FacilitiesMapComponent";
import { EN_MESSAGES } from "@/test/messages";

const mockRules = vi.fn();

vi.mock("maplibre-gl/dist/maplibre-gl.css", () => ({}));
vi.mock("@/components/map/FacilityPanel/FacilityPanelComponent", () => ({
	FacilityPanel: ({ facility, onClose }: { facility: { name: string }; onClose: () => void }) => (
		<button type="button" onClick={onClose}>
			panel:{facility.name}
		</button>
	),
}));
vi.mock("@/components/map/FacilitiesMap/FacilitiesMapComponent.rules", () => ({
	useFacilitiesMapRules: () => mockRules(),
}));

const FACILITY = {
	id: "f1",
	marketId: "austin",
	name: "Eastside Futsal Arena",
	avatarUrl: null,
	location: { latitude: 30.27, longitude: -97.74 },
};
const closePanel = vi.fn();

function rulesWith(status: string, overrides: object = {}) {
	return {
		closePanel,
		containerRef: { current: null },
		hovered: null,
		messages: EN_MESSAGES.map,
		selectedFacility: null,
		status,
		...overrides,
	};
}

describe("FacilitiesMap", () => {
	it("renders only the map and its attribution", () => {
		mockRules.mockReturnValue(rulesWith("ready"));

		render(<FacilitiesMap />);

		expect(screen.getByRole("region", { name: "Facilities map" })).toBeInTheDocument();
		expect(screen.getByTestId("facilities-map")).toBeInTheDocument();
		expect(screen.queryByRole("status")).not.toBeInTheDocument();
		expect(screen.getByRole("link", { name: "OpenStreetMap contributors" })).toHaveAttribute(
			"href",
			"https://www.openstreetmap.org/copyright",
		);
	});

	it("shows the hover card with the facility logo and name next to the pointer", () => {
		mockRules.mockReturnValue(
			rulesWith("ready", { hovered: { facility: FACILITY, x: 100, y: 50 } }),
		);

		render(<FacilitiesMap />);

		const tooltip = screen.getByRole("tooltip");
		expect(tooltip).toHaveTextContent("EFEastside Futsal Arena");
		expect(tooltip).toHaveStyle({ left: "114px", top: "64px" });
	});

	it("opens the panel for the selected facility", () => {
		mockRules.mockReturnValue(rulesWith("ready", { selectedFacility: FACILITY }));

		render(<FacilitiesMap />);

		expect(screen.getByRole("region", { name: "Facilities map" })).toHaveAttribute(
			"data-panel-open",
			"true",
		);
		fireEvent.click(screen.getByRole("button", { name: "panel:Eastside Futsal Arena" }));
		expect(closePanel).toHaveBeenCalled();
	});

	it.each([
		["loading", EN_MESSAGES.map.loading],
		["error", EN_MESSAGES.map.failed],
	])("shows the %s overlay", (status, text) => {
		mockRules.mockReturnValue(rulesWith(status));

		render(<FacilitiesMap />);

		expect(screen.getByRole("status")).toHaveTextContent(text);
	});
});
