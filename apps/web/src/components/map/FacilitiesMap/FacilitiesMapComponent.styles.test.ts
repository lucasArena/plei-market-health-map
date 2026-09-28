import { validateStyleMin } from "@maplibre/maplibre-gl-style-spec";
import type { CircleLayerSpecification } from "maplibre-gl";
import {
	FACILITIES_LAYER_ID,
	FACILITIES_SOURCE_ID,
	FACILITY_DOT_PAINT,
	selectedStrokeColor,
	selectedStrokeWidth,
} from "@/components/map/FacilitiesMap/FacilitiesMapComponent.styles";

function styleErrors(paint: CircleLayerSpecification["paint"]) {
	return validateStyleMin({
		version: 8,
		sources: {
			[FACILITIES_SOURCE_ID]: {
				type: "geojson",
				data: { type: "FeatureCollection", features: [] },
			},
		},
		layers: [{ id: FACILITIES_LAYER_ID, type: "circle", source: FACILITIES_SOURCE_ID, paint }],
	});
}

describe("facility dot styles", () => {
	it("is a valid MapLibre circle paint", () => {
		expect(styleErrors(FACILITY_DOT_PAINT)).toEqual([]);
	});

	it.each(["f1", null])("builds valid selection expressions for %s", (facilityId) => {
		expect(
			styleErrors({
				...FACILITY_DOT_PAINT,
				"circle-stroke-color": selectedStrokeColor(facilityId),
				"circle-stroke-width": selectedStrokeWidth(facilityId),
			}),
		).toEqual([]);
	});
});
