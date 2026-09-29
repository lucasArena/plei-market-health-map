import { act, renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { EN_MESSAGES } from "@/application/test/messages";
import { MessagesProvider } from "@/presentation/components/i18n/MessagesProvider/MessagesProviderComponent";
import {
	appSessionHeatmapAreas,
	appSessionHeatmapScale,
	facilitiesForIds,
	placeHover,
	resolveMapStatus,
	toAppSessionHeatmapFeatureCollection,
	toFacilityFeatureCollection,
	useFacilitiesMapScreenRules,
} from "@/presentation/screens/FacilitiesMapScreen/FacilitiesMapScreenComponent.rules";
import {
	APP_SESSION_HEATMAP_LAYER_ID,
	APP_SESSION_HEATMAP_SOURCE_ID,
	CLUSTER_LAYER_ID,
	FACILITIES_LAYER_ID,
	selectedRingWidth,
} from "@/presentation/screens/FacilitiesMapScreen/FacilitiesMapScreenComponent.styles";

const mapState = vi.hoisted(() => ({
	instances: [] as Array<Record<string, ReturnType<typeof vi.fn>>>,
	handlers: new Map<string, (...args: unknown[]) => unknown>(),
	canvas: { style: { cursor: "" } },
	setData: vi.fn(),
	getClusterLeaves: vi.fn(),
	getClusterExpansionZoom: vi.fn(),
	setWorkerUrl: vi.fn(),
}));

vi.mock("maplibre-gl", () => {
	class MockMap {
		addControl = vi.fn();
		addSource = vi.fn();
		addLayer = vi.fn();
		remove = vi.fn();
		off = vi.fn();
		easeTo = vi.fn();
		setPaintProperty = vi.fn();
		getCanvas = vi.fn(() => mapState.canvas);
		getContainer = vi.fn(() => ({ clientWidth: 1000, clientHeight: 800 }));
		getBounds = vi.fn(() => ({ contains: () => true }));
		getSource = vi.fn(() => ({
			setData: mapState.setData,
			getClusterLeaves: mapState.getClusterLeaves,
			getClusterExpansionZoom: mapState.getClusterExpansionZoom,
		}));
		on = vi.fn((event: string, layerOrHandler: unknown, handler?: unknown) => {
			const key = handler ? `${event}:${String(layerOrHandler)}` : event;
			mapState.handlers.set(key, (handler ?? layerOrHandler) as (...args: unknown[]) => unknown);
		});
		constructor(public options: unknown) {
			mapState.instances.push(this as unknown as Record<string, ReturnType<typeof vi.fn>>);
		}
	}
	class MockNavigationControl {}
	return {
		Map: MockMap,
		NavigationControl: MockNavigationControl,
		setWorkerUrl: mapState.setWorkerUrl,
	};
});

const mockUseFacilities = vi.fn();
const mockLoadPleiLogos = vi.fn();

vi.mock("@/presentation/components/map/plei-logo-marker", async (importOriginal) => ({
	...(await importOriginal<object>()),
	loadPleiLogos: (map: unknown) => mockLoadPleiLogos(map),
}));

vi.mock("@/infrastructure/api/use-facilities", () => ({
	useFacilities: () => mockUseFacilities(),
}));

const mockUseAppSessionHeatmap = vi.fn();
vi.mock("@/infrastructure/api/use-app-session-heatmap", () => ({
	useAppSessionHeatmap: () => mockUseAppSessionHeatmap(),
}));

const FACILITY = {
	id: "f1",
	marketId: "austin",
	name: "Eastside Futsal Arena",
	avatarUrl: null,
	isActive: true,
	location: { latitude: 30.27, longitude: -97.74 },
};

function wrapper({ children }: { children: ReactNode }) {
	return createElement(MessagesProvider, { locale: "en", messages: EN_MESSAGES, children });
}

function renderRules() {
	const container = document.createElement("div");
	return renderHook(
		() => {
			const rules = useFacilitiesMapScreenRules();
			rules.containerRef.current ??= container;
			return rules;
		},
		{ wrapper },
	);
}

describe("toFacilityFeatureCollection", () => {
	it("turns facilities into GeoJSON points", () => {
		expect(toFacilityFeatureCollection([FACILITY])).toEqual({
			type: "FeatureCollection",
			features: [
				{
					type: "Feature",
					geometry: { type: "Point", coordinates: [-97.74, 30.27] },
					properties: {
						id: "f1",
						marketId: "austin",
						name: "Eastside Futsal Arena",
						isActive: true,
					},
				},
			],
		});
	});
});

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
});

describe("placeHover", () => {
	it("keeps the card below-right unless it would leave the map", () => {
		const size = { width: 1000, height: 800 };
		expect(placeHover({ x: 100, y: 100 }, size)).toEqual({
			x: 100,
			y: 100,
			flipX: false,
			flipY: false,
		});
		expect(placeHover({ x: 900, y: 700 }, size)).toEqual({
			x: 900,
			y: 700,
			flipX: true,
			flipY: true,
		});
	});
});

describe("facilitiesForIds", () => {
	it("keeps known string ids in order", () => {
		const byId = new Map([["f1", FACILITY]]);
		expect(facilitiesForIds(["f1", "missing", 3, undefined], byId)).toEqual([FACILITY]);
	});
});

describe("resolveMapStatus", () => {
	it("maps query state to a status", () => {
		expect(resolveMapStatus(true, false)).toBe("loading");
		expect(resolveMapStatus(false, true)).toBe("error");
		expect(resolveMapStatus(false, false)).toBe("ready");
	});
});

describe("useFacilitiesMapScreenRules", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mapState.instances.length = 0;
		mapState.handlers.clear();
		mockUseFacilities.mockReturnValue({ data: [FACILITY], isPending: false, isError: false });
		mockUseAppSessionHeatmap.mockReturnValue({
			data: [{ lat: 29.75, lng: -95.35, sessionWeight: 10 }],
			isPending: false,
			isError: false,
		});
		mockLoadPleiLogos.mockResolvedValue(undefined);
	});

	it("creates the map, adds the dot layer on load and pushes the facilities", async () => {
		const { result } = renderRules();

		await waitFor(() => expect(mapState.instances).toHaveLength(1));
		const map = mapState.instances[0];
		act(() => mapState.handlers.get("load")?.());

		expect(mapState.setWorkerUrl).toHaveBeenCalledWith(
			"http://localhost:3000/maplibre/maplibre-gl-worker.mjs",
		);
		expect(map?.addSource).toHaveBeenCalledWith(APP_SESSION_HEATMAP_SOURCE_ID, expect.anything());
		expect(map?.addSource).toHaveBeenCalledWith("facilities", expect.anything());
		expect(map?.addSource).toHaveBeenCalledWith(
			"facilities",
			expect.objectContaining({ cluster: true, clusterRadius: 40 }),
		);
		await waitFor(() => expect(map?.addLayer).toHaveBeenCalledTimes(5));
		expect(mockLoadPleiLogos).toHaveBeenCalledWith(map);
		const addLayer = map?.addLayer;
		if (!addLayer) throw new Error("Expected addLayer mock");
		const layerIds = addLayer.mock.calls.map((call) => (call[0] as { id: string }).id);
		expect(layerIds.indexOf(APP_SESSION_HEATMAP_LAYER_ID)).toBeLessThan(
			layerIds.indexOf(CLUSTER_LAYER_ID),
		);
		expect(layerIds.indexOf(APP_SESSION_HEATMAP_LAYER_ID)).toBeLessThan(
			layerIds.indexOf(FACILITIES_LAYER_ID),
		);
		expect(map?.addLayer).toHaveBeenLastCalledWith(
			expect.objectContaining({
				id: "facilities-logos",
				type: "symbol",
				layout: expect.objectContaining({
					"icon-image": ["case", ["==", ["get", "isActive"], true], "plei-logo", "plei-logo-muted"],
				}),
			}),
		);
		expect(map?.addLayer).toHaveBeenCalledWith(
			expect.objectContaining({ id: APP_SESSION_HEATMAP_LAYER_ID, type: "heatmap" }),
		);
		expect(map?.addLayer).toHaveBeenCalledWith(
			expect.objectContaining({ id: FACILITIES_LAYER_ID, type: "circle" }),
		);
		expect(map?.addLayer).toHaveBeenCalledWith(
			expect.objectContaining({ id: CLUSTER_LAYER_ID, type: "circle" }),
		);
		await waitFor(() =>
			expect(mapState.setData).toHaveBeenCalledWith(
				expect.objectContaining({ features: [expect.objectContaining({ type: "Feature" })] }),
			),
		);
		expect(result.current.status).toBe("ready");
		expect(result.current.messages).toBe(EN_MESSAGES.map);
		expect(result.current.sessionScale).toEqual({ low: 10, high: 10 });
		mapState.setData.mockClear();
		act(() => mapState.handlers.get("moveend")?.());
		expect(mapState.setData).toHaveBeenCalledWith(
			expect.objectContaining({ features: [expect.objectContaining({ type: "Feature" })] }),
		);
	});

	it("shows a hover card for a facility", async () => {
		const { result } = renderRules();
		await waitFor(() => expect(mapState.instances).toHaveLength(1));
		act(() => mapState.handlers.get("load")?.());
		await waitFor(() =>
			expect(mapState.handlers.has(`mousemove:${FACILITIES_LAYER_ID}`)).toBe(true),
		);
		const event = (id: unknown) => ({
			features: [{ properties: { id } }],
			point: { x: 120, y: 80 },
		});

		act(() => mapState.handlers.get(`mousemove:${FACILITIES_LAYER_ID}`)?.(event("f1")));
		expect(result.current.hovered).toEqual({
			kind: "facility",
			facility: FACILITY,
			x: 120,
			y: 80,
			flipX: false,
			flipY: false,
		});
		act(() => mapState.handlers.get(`mousemove:${FACILITIES_LAYER_ID}`)?.(event("missing")));
		expect(result.current.hovered).toBeNull();

		act(() => mapState.handlers.get(`mousemove:${FACILITIES_LAYER_ID}`)?.(event("f1")));
		act(() => mapState.handlers.get("movestart")?.());
		expect(result.current.hovered).toBeNull();

		act(() => mapState.handlers.get(`mousemove:${FACILITIES_LAYER_ID}`)?.(event("f1")));
		act(() => mapState.handlers.get(`mouseleave:${FACILITIES_LAYER_ID}`)?.());
		expect(result.current.hovered).toBeNull();
	});

	it("opens the detail panel on facility click and closes it with an animation", async () => {
		const { result } = renderRules();
		await waitFor(() => expect(mapState.instances).toHaveLength(1));
		act(() => mapState.handlers.get("load")?.());
		await waitFor(() => expect(mapState.handlers.has(`click:${FACILITIES_LAYER_ID}`)).toBe(true));
		const map = mapState.instances[0];
		const event = (id: unknown) => ({ features: [{ properties: { id } }], point: { x: 1, y: 1 } });

		act(() => mapState.handlers.get(`mouseenter:${FACILITIES_LAYER_ID}`)?.());
		expect(mapState.canvas.style.cursor).toBe("pointer");

		act(() => mapState.handlers.get(`click:${FACILITIES_LAYER_ID}`)?.(event("missing")));
		expect(result.current.selectedFacilityId).toBeNull();

		act(() => mapState.handlers.get(`mousemove:${FACILITIES_LAYER_ID}`)?.(event("f1")));
		act(() => mapState.handlers.get(`click:${FACILITIES_LAYER_ID}`)?.(event("f1")));
		expect(result.current.selectedFacilityId).toBe("f1");
		expect(result.current.isPanelClosing).toBe(false);
		expect(result.current.hovered).toBeNull();
		expect(map?.easeTo).toHaveBeenCalledWith({
			center: [-97.74, 30.27],
			padding: { top: 0, bottom: 0, left: 0, right: 384 },
			duration: 600,
		});
		expect(map?.setPaintProperty).toHaveBeenLastCalledWith(
			FACILITIES_LAYER_ID,
			"circle-stroke-width",
			selectedRingWidth("f1"),
		);

		act(() => result.current.closePanel());
		expect(result.current.isPanelClosing).toBe(true);
		expect(result.current.selectedFacilityId).toBe("f1");
		expect(map?.easeTo).toHaveBeenLastCalledWith({
			padding: { top: 0, bottom: 0, left: 0, right: 0 },
			duration: 600,
		});
		expect(map?.setPaintProperty).toHaveBeenLastCalledWith(
			FACILITIES_LAYER_ID,
			"circle-stroke-width",
			selectedRingWidth(null),
		);

		act(() => result.current.handlePanelClosed());
		expect(result.current.selectedFacilityId).toBeNull();
		expect(result.current.isPanelClosing).toBe(false);

		act(() => mapState.handlers.get(`mouseleave:${FACILITIES_LAYER_ID}`)?.());
		expect(mapState.canvas.style.cursor).toBe("");
	});

	it("lists a hovered cluster's facilities and zooms in on click", async () => {
		const { result } = renderRules();
		await waitFor(() => expect(mapState.instances).toHaveLength(1));
		act(() => mapState.handlers.get("load")?.());
		await waitFor(() => expect(mapState.handlers.has(`mousemove:${CLUSTER_LAYER_ID}`)).toBe(true));
		const map = mapState.instances[0];
		const clusterEvent = (x: number, clusterId: unknown = 7) => ({
			features: [
				{
					properties: { cluster_id: clusterId, point_count: 12 },
					geometry: { type: "Point", coordinates: [-97.7, 30.3] },
				},
			],
			point: { x, y: 40 },
		});
		mapState.getClusterLeaves.mockResolvedValue([{ properties: { id: "f1" } }]);
		mapState.getClusterExpansionZoom.mockResolvedValue(9);

		act(() => mapState.handlers.get(`mouseenter:${CLUSTER_LAYER_ID}`)?.());
		expect(mapState.canvas.style.cursor).toBe("pointer");
		act(() => mapState.handlers.get(`mouseleave:${CLUSTER_LAYER_ID}`)?.());
		expect(mapState.canvas.style.cursor).toBe("");

		await act(async () => {
			mapState.handlers.get(`mousemove:${CLUSTER_LAYER_ID}`)?.(clusterEvent(10));
		});
		expect(mapState.getClusterLeaves).toHaveBeenCalledWith(7, 8, 0);
		expect(result.current.hovered).toEqual({
			kind: "cluster",
			clusterId: 7,
			total: 12,
			facilities: [FACILITY],
			x: 10,
			y: 40,
			flipX: false,
			flipY: false,
		});

		act(() => mapState.handlers.get(`mousemove:${CLUSTER_LAYER_ID}`)?.(clusterEvent(30)));
		expect(mapState.getClusterLeaves).toHaveBeenCalledTimes(1);
		expect(result.current.hovered).toMatchObject({ x: 30, facilities: [FACILITY] });

		act(() => mapState.handlers.get(`mousemove:${CLUSTER_LAYER_ID}`)?.(clusterEvent(30, "bad")));
		expect(result.current.hovered).toMatchObject({ clusterId: 7 });

		await act(async () => {
			mapState.handlers.get(`click:${CLUSTER_LAYER_ID}`)?.(clusterEvent(30));
		});
		expect(result.current.hovered).toBeNull();
		expect(map?.easeTo).toHaveBeenCalledWith({ center: [-97.7, 30.3], zoom: 9, duration: 500 });

		act(() => mapState.handlers.get(`click:${CLUSTER_LAYER_ID}`)?.(clusterEvent(30, null)));
		expect(map?.easeTo).toHaveBeenCalledTimes(1);
	});

	it("ignores cluster results that arrive after the pointer left", async () => {
		const { result } = renderRules();
		await waitFor(() => expect(mapState.instances).toHaveLength(1));
		act(() => mapState.handlers.get("load")?.());
		await waitFor(() => expect(mapState.handlers.has(`mousemove:${CLUSTER_LAYER_ID}`)).toBe(true));
		let resolveLeaves: (value: unknown) => void = () => undefined;
		mapState.getClusterLeaves.mockReturnValue(
			new Promise((resolve) => {
				resolveLeaves = resolve;
			}),
		);
		mapState.getClusterExpansionZoom.mockRejectedValue(new Error("gone"));

		act(() =>
			mapState.handlers.get(`mousemove:${CLUSTER_LAYER_ID}`)?.({
				features: [
					{
						properties: { cluster_id: 3, point_count: 4 },
						geometry: { type: "Point", coordinates: [0, 0] },
					},
				],
				point: { x: 1, y: 1 },
			}),
		);
		act(() => mapState.handlers.get(`mouseleave:${CLUSTER_LAYER_ID}`)?.());
		await act(async () => {
			resolveLeaves([{ properties: { id: "f1" } }]);
		});

		expect(result.current.hovered).toBeNull();
		await act(async () => {
			mapState.handlers.get(`click:${CLUSTER_LAYER_ID}`)?.({
				features: [
					{
						properties: { cluster_id: 3, point_count: 4 },
						geometry: { type: "Point", coordinates: [0, 0] },
					},
				],
				point: { x: 1, y: 1 },
			});
		});
		expect(mapState.instances[0]?.easeTo).not.toHaveBeenCalled();

		mapState.getClusterLeaves.mockRejectedValue(new Error("gone"));
		await act(async () => {
			mapState.handlers.get(`mousemove:${CLUSTER_LAYER_ID}`)?.({
				features: [
					{
						properties: { cluster_id: 5, point_count: 4 },
						geometry: { type: "Point", coordinates: [0, 0] },
					},
				],
				point: { x: 2, y: 2 },
			});
		});
		expect(result.current.hovered).toMatchObject({ clusterId: 5, facilities: [] });
	});

	it("keeps the plain markers when the logo fails to load or the map is gone", async () => {
		mockLoadPleiLogos.mockRejectedValueOnce(new Error("no image"));
		renderRules();
		await waitFor(() => expect(mapState.instances).toHaveLength(1));
		act(() => mapState.handlers.get("load")?.());
		await act(async () => undefined);
		expect(mapState.instances[0]?.addLayer).toHaveBeenCalledTimes(4);

		let resolveLogo: () => void = () => undefined;
		mockLoadPleiLogos.mockReturnValueOnce(
			new Promise<void>((resolve) => {
				resolveLogo = resolve;
			}),
		);
		mapState.instances.length = 0;
		const second = renderRules();
		await waitFor(() => expect(mapState.instances).toHaveLength(1));
		act(() => mapState.handlers.get("load")?.());
		second.unmount();
		await act(async () => resolveLogo());
		expect(mapState.instances[0]?.addLayer).toHaveBeenCalledTimes(4);
	});

	it("removes the map on unmount", async () => {
		const { unmount } = renderRules();
		await waitFor(() => expect(mapState.instances).toHaveLength(1));
		const map = mapState.instances[0];

		act(() => mapState.handlers.get("load")?.());
		await waitFor(() =>
			expect(mapState.handlers.has(`mousemove:${FACILITIES_LAYER_ID}`)).toBe(true),
		);

		unmount();

		expect(map?.off).toHaveBeenCalledTimes(10);
		expect(map?.remove).toHaveBeenCalled();
	});

	it("does not create a map when unmounted before maplibre loads", async () => {
		const { unmount } = renderRules();
		unmount();
		await new Promise((resolve) => setTimeout(resolve, 0));
		expect(mapState.instances).toHaveLength(0);
	});

	it("soft-fails heatmap errors without breaking facilities status", async () => {
		mockUseAppSessionHeatmap.mockReturnValue({
			data: undefined,
			isPending: false,
			isError: true,
		});
		const { result } = renderRules();
		await waitFor(() => expect(mapState.instances).toHaveLength(1));
		act(() => mapState.handlers.get("load")?.());
		await waitFor(() =>
			expect(mapState.setData).toHaveBeenCalledWith(
				expect.objectContaining({ features: [expect.objectContaining({ type: "Feature" })] }),
			),
		);
		expect(mapState.setData).toHaveBeenCalledWith({ type: "FeatureCollection", features: [] });
		expect(result.current.status).toBe("ready");
		expect(mapState.handlers.has(`mousemove:${APP_SESSION_HEATMAP_LAYER_ID}`)).toBe(false);
		expect(mapState.handlers.has(`click:${APP_SESSION_HEATMAP_LAYER_ID}`)).toBe(false);
	});

	it("reports loading with no facilities yet", () => {
		mockUseFacilities.mockReturnValue({ data: undefined, isPending: true, isError: false });
		const { result } = renderRules();
		expect(result.current.status).toBe("loading");
	});

	it("skips the map when there is no container", () => {
		renderHook(() => useFacilitiesMapScreenRules(), { wrapper });
		expect(mapState.instances).toHaveLength(0);
	});
});
