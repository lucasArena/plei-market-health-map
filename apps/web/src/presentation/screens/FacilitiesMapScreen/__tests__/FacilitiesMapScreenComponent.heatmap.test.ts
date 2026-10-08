import {
	appSessionHeatmapAreas,
	appSessionHeatmapScale,
	toAppSessionHeatmapFeatureCollection,
} from "@/presentation/screens/FacilitiesMapScreen/FacilitiesMapScreenComponent.heatmap";

describe("toAppSessionHeatmapFeatureCollection", () => {
	it("turns heatmap cells into GeoJSON points with viewport-relative intensity", () => {
		expect(
			toAppSessionHeatmapFeatureCollection([{ lat: 29.75, lng: -95.35, sessionWeight: 10 }]),
		).toEqual({
			type: "FeatureCollection",
			features: [
				{
					type: "Feature",
					geometry: { type: "Point", coordinates: [-95.35, 29.75] },
					properties: { sessionWeight: 10, intensity: 1 },
				},
			],
		});
	});

	it("filters to the viewport and rescales the visible distribution", () => {
		const cells = [
			{ lat: 30, lng: -97, sessionWeight: 10 },
			{ lat: 31, lng: -96, sessionWeight: 100 },
			{ lat: 40, lng: -80, sessionWeight: 10_000 },
		];
		const bounds = { contains: ([lng]: [number, number]) => lng < -90 };
		const features = toAppSessionHeatmapFeatureCollection(cells, bounds).features;

		expect(features).toHaveLength(2);
		expect(features[0]?.properties.intensity).toBeLessThan(features[1]?.properties.intensity ?? 0);
		expect(features[1]?.properties.intensity).toBe(1);
	});

	it("uses a default ceiling when every session weight is zero", () => {
		const result = toAppSessionHeatmapFeatureCollection([{ lat: 29, lng: -95, sessionWeight: 0 }]);
		expect(result.features[0]?.properties.intensity).toBe(0.01);
	});
});

describe("appSessionHeatmapScale", () => {
	it("returns the visible distribution's numeric range", () => {
		const cells = [
			{ lat: 30, lng: -97, sessionWeight: 10 },
			{ lat: 31, lng: -96, sessionWeight: 100 },
			{ lat: 40, lng: -80, sessionWeight: 10_000 },
		];
		const bounds = { contains: ([lng]: [number, number]) => lng < -90 };

		expect(appSessionHeatmapScale(cells, bounds)).toEqual({ low: 10, high: 100 });
	});

	it("returns a zero range when the viewport has no activity", () => {
		expect(appSessionHeatmapScale([], { contains: () => false })).toEqual({ low: 0, high: 0 });
	});

	it("combines more sessions per shaded area when zoomed out", () => {
		const cells = [
			{ lat: 29.75, lng: -95.35, sessionWeight: 100 },
			{ lat: 29.75, lng: -95.34, sessionWeight: 200 },
		];
		const zoomedOut = {
			contains: () => true,
			getWest: () => -100,
			getEast: () => -90,
			getSouth: () => 25,
			getNorth: () => 35,
		};
		const zoomedIn = {
			contains: () => true,
			getWest: () => -95.36,
			getEast: () => -95.33,
			getSouth: () => 29.74,
			getNorth: () => 29.76,
		};

		expect(appSessionHeatmapAreas(cells, zoomedOut)).toHaveLength(1);
		expect(appSessionHeatmapScale(cells, zoomedOut)).toEqual({ low: 300, high: 300 });
		expect(appSessionHeatmapAreas(cells, zoomedIn)).toHaveLength(2);
		expect(appSessionHeatmapScale(cells, zoomedIn)).toEqual({ low: 100, high: 200 });
	});

	it("skips area bucketing when bounds edges are invalid", () => {
		const cells = [{ lat: 29.75, lng: -95.35, sessionWeight: 100 }];
		const invalid = {
			contains: () => true,
			getWest: () => -90,
			getEast: () => -100,
			getSouth: () => 25,
			getNorth: () => 35,
		};
		expect(appSessionHeatmapAreas(cells, invalid)).toEqual(cells);
	});

	it("builds the scale from raw cells when area aggregation is off", () => {
		const cells = [
			{ lat: 29.75, lng: -95.35, sessionWeight: 100 },
			{ lat: 29.75, lng: -95.34, sessionWeight: 200 },
		];
		const bounds = {
			contains: () => true,
			getWest: () => -100,
			getEast: () => -90,
			getSouth: () => 25,
			getNorth: () => 35,
		};
		expect(appSessionHeatmapScale(cells, bounds, false)).toEqual({ low: 100, high: 200 });
	});
});
