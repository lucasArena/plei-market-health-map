import { validateStyleMin } from "@maplibre/maplibre-gl-style-spec";
import type { CircleLayerSpecification, HeatmapLayerSpecification } from "maplibre-gl";
import {
	APP_SESSION_HEATMAP_LAYER_ID,
	APP_SESSION_HEATMAP_PAINT,
	APP_SESSION_HEATMAP_SOURCE_ID,
	CLUSTER_ACTIVE_COUNT_EXPRESSION,
	CLUSTER_ACTIVE_COUNT_KEY,
	CLUSTER_BORDER_COLOR,
	CLUSTER_CIRCLE_RADIUS,
	CLUSTER_COUNT_LAYOUT,
	CLUSTER_COUNT_PAINT,
	CLUSTER_FILTER,
	CLUSTER_GLASS_STROKE,
	CLUSTER_GLASS_STROKE_INSET,
	CLUSTER_OUTER_DIAMETER,
	CLUSTER_PAINT,
	FACILITIES_LAYER_ID,
	FACILITIES_SOURCE_ID,
	FACILITY_COLOR,
	FACILITY_DOT_LAYOUT,
	FACILITY_DOT_PAINT,
	FACILITY_GLASS_CORE_SIZE,
	FACILITY_GLASS_DIAMETER,
	FACILITY_LOGO_LAYOUT,
	SESSION_HEATMAP_BUCKET_COLORS,
	SESSION_HEATMAP_BUCKET_OPACITIES,
	selectedRingColor,
	selectedRingWidth,
	UNCLUSTERED_FILTER,
} from "@/presentation/screens/FacilitiesMapScreen/FacilitiesMapScreenComponent.styles";

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
	it("keeps the cluster circle as an invisible hit target under the glass disc", () => {
		expect(CLUSTER_OUTER_DIAMETER).toBe(41);
		expect(CLUSTER_GLASS_STROKE).toBe(2);
		expect(CLUSTER_GLASS_STROKE_INSET).toBe(3);
		expect(CLUSTER_BORDER_COLOR).toBe("#86EFAC");
		expect(CLUSTER_PAINT?.["circle-opacity"]).toBe(0);
		expect(CLUSTER_PAINT?.["circle-radius"]).toBe(CLUSTER_CIRCLE_RADIUS);
		expect(CLUSTER_COUNT_PAINT?.["text-opacity"]).toBe(0);
		expect(CLUSTER_ACTIVE_COUNT_KEY).toBe("activeCount");
		expect(CLUSTER_ACTIVE_COUNT_EXPRESSION).toEqual([
			"+",
			["case", ["==", ["get", "isActive"], true], 1, 0],
		]);
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
						layout: FACILITY_DOT_LAYOUT,
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

describe("facility stacking order", () => {
	it("draws active dots and logos above inactive ones at the same spot", () => {
		const activeOnTop = ["case", ["==", ["get", "isActive"], true], 1, 0];
		expect(FACILITY_DOT_LAYOUT?.["circle-sort-key"]).toEqual(activeOnTop);
		expect(FACILITY_LOGO_LAYOUT?.["symbol-sort-key"]).toEqual(activeOnTop);
	});
});

describe("facility dot styles", () => {
	it("is an invisible hit circle under a 29px glass disc", () => {
		expect(FACILITY_GLASS_DIAMETER).toBe(29);
		expect(FACILITY_GLASS_CORE_SIZE).toBe(17);
		expect(FACILITY_DOT_PAINT?.["circle-opacity"]).toBe(0);
		expect(FACILITY_DOT_PAINT?.["circle-radius"]).toBe(14.5);
		expect(styleErrors(FACILITY_DOT_PAINT)).toEqual([]);
	});
});

describe("app session weather-map styles", () => {
	it("uses a continuous Pleiful heat scale at every zoom", () => {
		expect(SESSION_HEATMAP_BUCKET_COLORS).toEqual(["#4ADE80", "#16A34A", "#16755C"]);
		expect(new Set(SESSION_HEATMAP_BUCKET_COLORS).size).toBe(3);
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
