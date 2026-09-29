import { validateStyleMin } from "@maplibre/maplibre-gl-style-spec";
import type { CircleLayerSpecification, HeatmapLayerSpecification } from "maplibre-gl";
import {
	APP_SESSION_HEATMAP_LAYER_ID,
	APP_SESSION_HEATMAP_PAINT,
	APP_SESSION_HEATMAP_SOURCE_ID,
	CLUSTER_COUNT_LAYOUT,
	CLUSTER_COUNT_PAINT,
	CLUSTER_FILTER,
	CLUSTER_PAINT,
	FACILITIES_LAYER_ID,
	FACILITIES_SOURCE_ID,
	FACILITY_COLOR,
	FACILITY_DOT_PAINT,
	FACILITY_LOGO_LAYOUT,
	SESSION_HEATMAP_BUCKET_COLORS,
	SESSION_HEATMAP_BUCKET_OPACITIES,
	selectedRingColor,
	selectedRingWidth,
	UNCLUSTERED_FILTER,
} from "@/components/map/FacilitiesMap/FacilitiesMapComponent.styles";

function styleErrors(
	paint: CircleLayerSpecification["paint"],
	sourceId = FACILITIES_SOURCE_ID,
	layerId = FACILITIES_LAYER_ID,
) {
	return validateStyleMin({
		version: 8,
		sources: {
			[sourceId]: {
				type: "geojson",
				data: { type: "FeatureCollection", features: [] },
			},
		},
		layers: [{ id: layerId, type: "circle", source: sourceId, paint }],
	});
}

describe("cluster styles", () => {
	it("uses the facility green for cluster fill", () => {
		expect(FACILITY_COLOR).toBe("#0B3B2E");
		expect(CLUSTER_PAINT?.["circle-color"]).toBe(FACILITY_COLOR);
	});

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

describe("app session weather-map styles", () => {
	it("uses a continuous Pleiful heat scale at every zoom", () => {
		expect(SESSION_HEATMAP_BUCKET_COLORS).toEqual(["#E0F2FE", "#7DD3FC", "#0EA5E9", "#7C3AED"]);
		expect(new Set(SESSION_HEATMAP_BUCKET_COLORS).size).toBe(4);
		expect(SESSION_HEATMAP_BUCKET_COLORS).not.toContain(FACILITY_COLOR);
		expect(SESSION_HEATMAP_BUCKET_OPACITIES).toEqual([0.35, 0.55, 0.75, 0.92]);
		const colorExpr = JSON.stringify(APP_SESSION_HEATMAP_PAINT?.["heatmap-color"]);
		expect(colorExpr).toContain('"heatmap-density"');
		for (const hex of SESSION_HEATMAP_BUCKET_COLORS) {
			expect(colorExpr).toContain(hex);
		}
		expect(APP_SESSION_HEATMAP_PAINT?.["heatmap-weight"]).toEqual(["get", "intensity"]);
		expect(APP_SESSION_HEATMAP_PAINT?.["heatmap-opacity"]).toBe(0.76);
		expect(JSON.stringify(APP_SESSION_HEATMAP_PAINT?.["heatmap-radius"])).toContain("40");
		expect(APP_SESSION_HEATMAP_SOURCE_ID).toBe("app-session-heatmap");
		expect(APP_SESSION_HEATMAP_LAYER_ID).toBe("app-session-density");
	});

	it("uses valid MapLibre paints", () => {
		expect(
			validateStyleMin({
				version: 8,
				sources: {
					[APP_SESSION_HEATMAP_SOURCE_ID]: {
						type: "geojson",
						data: { type: "FeatureCollection", features: [] },
					},
				},
				layers: [
					{
						id: APP_SESSION_HEATMAP_LAYER_ID,
						type: "heatmap",
						source: APP_SESSION_HEATMAP_SOURCE_ID,
						paint: APP_SESSION_HEATMAP_PAINT as HeatmapLayerSpecification["paint"],
					},
				],
			}),
		).toEqual([]);
	});
});

describe("selected ring styles", () => {
	it("are valid MapLibre expressions with and without a selection", () => {
		for (const id of ["f1", null]) {
			expect(
				styleErrors({
					...FACILITY_DOT_PAINT,
					"circle-stroke-color": selectedRingColor(id),
					"circle-stroke-width": selectedRingWidth(id),
				}),
			).toEqual([]);
		}
	});
});
