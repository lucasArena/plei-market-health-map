import { validateStyleMin } from "@maplibre/maplibre-gl-style-spec";
import type { CircleLayerSpecification } from "maplibre-gl";
import {
	CLUSTER_COUNT_LAYOUT,
	CLUSTER_COUNT_PAINT,
	CLUSTER_FILTER,
	CLUSTER_PAINT,
	FACILITIES_LAYER_ID,
	FACILITIES_SOURCE_ID,
	FACILITY_DOT_PAINT,
	FACILITY_LOGO_LAYOUT,
	UNCLUSTERED_FILTER,
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

describe("cluster styles", () => {
	it("are valid MapLibre cluster layers", () => {
		expect(
			validateStyleMin({
				version: 8,
				glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
				sources: {
					[FACILITIES_SOURCE_ID]: {
						type: "geojson",
						data: { type: "FeatureCollection", features: [] },
						cluster: true,
					},
				},
				layers: [
					{
						id: "clusters",
						type: "circle",
						source: FACILITIES_SOURCE_ID,
						filter: CLUSTER_FILTER,
						paint: CLUSTER_PAINT,
					},
					{
						id: "count",
						type: "symbol",
						source: FACILITIES_SOURCE_ID,
						filter: CLUSTER_FILTER,
						layout: CLUSTER_COUNT_LAYOUT,
						paint: CLUSTER_COUNT_PAINT,
					},
					{
						id: "dots",
						type: "circle",
						source: FACILITIES_SOURCE_ID,
						filter: UNCLUSTERED_FILTER,
						paint: FACILITY_DOT_PAINT,
					},
					{
						id: "logos",
						type: "symbol",
						source: FACILITIES_SOURCE_ID,
						filter: UNCLUSTERED_FILTER,
						layout: FACILITY_LOGO_LAYOUT,
					},
				],
			}),
		).toEqual([]);
	});
});

describe("facility dot styles", () => {
	it("is a valid MapLibre circle paint", () => {
		expect(styleErrors(FACILITY_DOT_PAINT)).toEqual([]);
	});
});
