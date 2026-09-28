import { render, screen } from "@testing-library/react";
import { FacilitiesMap } from "@/components/map/FacilitiesMap/FacilitiesMapComponent";
import { EN_MESSAGES } from "@/test/messages";

const mockRules = vi.fn();

vi.mock("maplibre-gl/dist/maplibre-gl.css", () => ({}));
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

function rulesWith(status: string, overrides: object = {}) {
	return {
		containerRef: { current: null },
		hovered: null,
		messages: EN_MESSAGES.map,
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

		render(<FacilitiesMap />);

		expect(screen.getByRole("tooltip")).toHaveTextContent("Eastside Futsal Arena");
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
