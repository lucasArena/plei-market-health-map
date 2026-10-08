import type { AppSessionFilters, FacilityPointView } from "@market-health-map/core/application";
import { act, renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { EN_MESSAGES } from "@/application/test/messages";
import {
	MapScopeProvider,
	useMapScope,
} from "@/presentation/components/providers/MapScopeProvider/MapScopeProviderComponent";
import { MessagesProvider } from "@/presentation/components/providers/MessagesProvider/MessagesProviderComponent";
import {
	clusterTrend,
	facilitiesForMap,
	facilityTrend,
	toFacilityFeatureCollection,
} from "@/presentation/screens/FacilitiesMapScreen/FacilitiesMapScreenComponent.facilities";
import {
	FACILITY_LAYER_ENTER_MS,
	FACILITY_LAYER_EXIT_MS,
	readClusterGlassBadges,
	readFacilityGlassBadges,
	syncFacilityGlass,
} from "@/presentation/screens/FacilitiesMapScreen/FacilitiesMapScreenComponent.glass";
import { appSessionHeatmapScale } from "@/presentation/screens/FacilitiesMapScreen/FacilitiesMapScreenComponent.heatmap";
import { clusterListZoom } from "@/presentation/screens/FacilitiesMapScreen/FacilitiesMapScreenComponent.hover";
import {
	resolveMapStatus,
	useFacilitiesMapScreenRules,
} from "@/presentation/screens/FacilitiesMapScreen/FacilitiesMapScreenComponent.rules";
import {
	APP_SESSION_HEATMAP_LAYER_ID,
	APP_SESSION_HEATMAP_PAINT,
	APP_SESSION_HEATMAP_SOURCE_ID,
	CLUSTER_ACTIVE_COUNT_EXPRESSION,
	CLUSTER_ACTIVE_COUNT_KEY,
	CLUSTER_HOVER_DISMISS_MS,
	CLUSTER_LAYER_ID,
	CLUSTER_MAX_ZOOM,
	FACILITIES_LAYER_ID,
	FACILITY_DOT_ZOOM,
	MAP_CURSOR,
	REGISTRATION_HEATMAP_PAINT,
	selectedRingWidth,
} from "@/presentation/screens/FacilitiesMapScreen/FacilitiesMapScreenComponent.styles";

const mapState = vi.hoisted(() => {
	const canvasContainer = document.createElement("div");
	const canvas = document.createElement("canvas");
	canvasContainer.appendChild(canvas);
	return {
		instances: [] as Array<Record<string, ReturnType<typeof vi.fn>>>,
		handlers: new Map<string, (...args: unknown[]) => unknown>(),
		canvas,
		setData: vi.fn(),
		getClusterLeaves: vi.fn(),
		getClusterExpansionZoom: vi.fn(),
		getClusterChildren: vi.fn(),
		setWorkerUrl: vi.fn(),
	};
});
const queryClient = vi.hoisted(() => ({}));
const mockPrefetchFacilityStats = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/react-query", () => ({
	useQueryClient: () => queryClient,
}));

vi.mock("@/presentation/hooks/use-facility/prefetch-facility-stats", () => ({
	prefetchFacilityStats: mockPrefetchFacilityStats,
}));

vi.mock("maplibre-gl", () => {
	class MockMap {
		addControl = vi.fn();
		addSource = vi.fn();
		addLayer = vi.fn();
		remove = vi.fn();
		off = vi.fn();
		easeTo = vi.fn();
		fitBounds = vi.fn();
		setPaintProperty = vi.fn();
		triggerRepaint = vi.fn();
		stop = vi.fn();
		project = vi.fn(() => ({ x: 200, y: 80 }));
		getCanvas = vi.fn(() => mapState.canvas);
		getCanvasContainer = vi.fn(() => mapState.canvas.parentElement ?? mapState.canvas);
		getCenter = vi.fn(() => ({ lng: -98, lat: 39 }));
		getContainer = vi.fn(() => ({ clientWidth: 1000, clientHeight: 800 }));
		getZoom = vi.fn(() => 4);
		getBounds = vi.fn(() => ({ contains: () => true }));
		getLayer = vi.fn((layerId: string) => ({ id: layerId }));
		setLayoutProperty = vi.fn();
		queryRenderedFeatures = vi.fn(() => []);
		getSource = vi.fn(() => ({
			setData: mapState.setData,
			getClusterLeaves: mapState.getClusterLeaves,
			getClusterChildren: mapState.getClusterChildren,
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
const mockUsePleiLogoImages = vi.fn();

vi.mock("@/presentation/hooks/use-map/use-plei-logo-images", () => ({
	usePleiLogoImages: (map: unknown) => mockUsePleiLogoImages(map),
}));

vi.mock("@/presentation/hooks/use-facility/use-facility-list-all", () => ({
	useFacilityListAll: () => mockUseFacilities(),
}));

const layersState = vi.hoisted(() => ({
	showActiveFacilities: true,
	showInactiveFacilities: true,
	showSessions: true,
	hasProvider: true,
	demandMetric: "sessions" as "sessions" | "registrations",
	supplyMetric: "facilities" as "facilities" | "games",
	gameDepartments: [] as ("magic" | "organizers" | "partnerships")[],
	showGamesTrend: false,
	sessionFilters: {} as AppSessionFilters,
	setSessionFilters: vi.fn(),
}));

vi.mock("@/presentation/components/map/MapLayersPanel/MapLayersPanelComponent.context", () => ({
	useMapLayers: () =>
		layersState.hasProvider
			? {
					showActiveFacilities: layersState.showActiveFacilities,
					showInactiveFacilities: layersState.showInactiveFacilities,
					setShowActiveFacilities: vi.fn(),
					setShowInactiveFacilities: vi.fn(),
					showSessions: layersState.showSessions,
					demandMetric: layersState.demandMetric,
					supplyMetric: layersState.supplyMetric,
					gameDepartments: layersState.gameDepartments,
					showGamesTrend: layersState.showGamesTrend,
					sessionFilters: layersState.sessionFilters,
					setSessionFilters: layersState.setSessionFilters,
					setShowSessions: vi.fn(),
				}
			: null,
}));

const mockDemandFlag = vi.fn(() => false);
const mockSupplyFlag = vi.fn(() => false);
const mockTrendFlag = vi.fn(() => true);
vi.mock("@/presentation/hooks/use-feature-flags/use-feature-flags", () => ({
	useFeatureFlag: (key: string) =>
		key === "facility-games-trend"
			? mockTrendFlag()
			: key === "facility-games-layer"
				? mockSupplyFlag()
				: mockDemandFlag(),
}));
const mockUseAppSessionHeatmap = vi.fn();
vi.mock("@/presentation/hooks/use-app/use-app-session-heatmap", () => ({
	useAppSessionHeatmap: (...args: unknown[]) => mockUseAppSessionHeatmap(...args),
}));

const FACILITY = {
	id: "f1",
	marketId: "austin",
	marketName: "Austin",
	name: "Eastside Futsal Arena",
	avatarUrl: null,
	isActive: true,
	isActiveLastWeek: true,
	location: { latitude: 30.27, longitude: -97.74 },
};

function sameInBothPeriods<T extends Partial<FacilityPointView>>(facility: T) {
	return {
		...facility,
		gamesLastWeek: facility.gamesLast28Days,
		gamesPreviousWeek: facility.gamesPrevious28Days,
		gamesLastWeekByDepartment: facility.gamesByDepartment,
		gamesPreviousWeekByDepartment: facility.gamesPreviousByDepartment,
	};
}

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
		layersState.showActiveFacilities = true;
		layersState.showInactiveFacilities = true;
		layersState.showSessions = true;
		layersState.hasProvider = true;
		layersState.sessionFilters = {};
		layersState.demandMetric = "sessions";
		mockDemandFlag.mockReturnValue(false);
		layersState.supplyMetric = "facilities";
		layersState.gameDepartments = [];
		layersState.showGamesTrend = false;
		mockSupplyFlag.mockReturnValue(false);
		layersState.setSessionFilters = vi.fn();
		mapState.instances.length = 0;
		mapState.handlers.clear();
		mockUseFacilities.mockReturnValue({ data: [FACILITY], isPending: false, isError: false });
		mockUseAppSessionHeatmap.mockReturnValue({
			data: [{ lat: 29.75, lng: -95.35, sessionWeight: 10 }],
			isPending: false,
			isError: false,
		});
		mockUsePleiLogoImages.mockImplementation((map: unknown) => map !== null);
	});

	it("hides inactive facilities by default when there is no layers provider", async () => {
		layersState.hasProvider = false;
		const inactive = { ...FACILITY, id: "inactive", isActive: false, isActiveLastWeek: false };
		mockUseFacilities.mockReturnValue({
			data: [FACILITY, inactive],
			isPending: false,
			isError: false,
		});
		renderRules();
		await waitFor(() => expect(mapState.instances).toHaveLength(1));
		act(() => mapState.handlers.get("load")?.());
		expect(mapState.setData).toHaveBeenCalledWith(toFacilityFeatureCollection([FACILITY]));
	});

	it("excludes zero-game facilities from Games even when inactive visibility is enabled", async () => {
		mockSupplyFlag.mockReturnValue(true);
		layersState.supplyMetric = "games";
		layersState.showInactiveFacilities = true;
		const played = sameInBothPeriods({ ...FACILITY, gamesLast28Days: 12 });
		const inactive = sameInBothPeriods({
			...FACILITY,
			id: "inactive",
			isActive: false,
			isActiveLastWeek: false,
			gamesLast28Days: 0,
		});
		const empty = sameInBothPeriods({ ...FACILITY, id: "empty", gamesLast28Days: 0 });
		mockUseFacilities.mockReturnValue({
			data: [played, inactive, empty],
			isPending: false,
			isError: false,
		});
		const { rerender } = renderRules();
		await waitFor(() => expect(mapState.instances).toHaveLength(1));
		act(() => mapState.handlers.get("load")?.());
		expect(mapState.setData).toHaveBeenCalledWith(toFacilityFeatureCollection([played]));
		mapState.setData.mockClear();
		layersState.supplyMetric = "facilities";
		rerender();
		expect(mapState.setData).toHaveBeenCalledWith(
			toFacilityFeatureCollection([played, inactive, empty]),
		);
	});

	it("uses selected departments for both Games and Facilities and restores all departments when cleared", async () => {
		mockSupplyFlag.mockReturnValue(true);
		layersState.supplyMetric = "games";
		layersState.gameDepartments = ["magic", "organizers"];
		const included = sameInBothPeriods({
			...FACILITY,
			gamesLast28Days: 10,
			gamesByDepartment: { magic: 3, organizers: 2, partnerships: 5 },
		});
		const excluded = sameInBothPeriods({
			...FACILITY,
			id: "other",
			gamesLast28Days: 7,
			gamesByDepartment: { magic: 0, organizers: 0, partnerships: 7 },
		});
		mockUseFacilities.mockReturnValue({
			data: [included, excluded],
			isPending: false,
			isError: false,
		});
		const { rerender } = renderRules();
		await waitFor(() => expect(mapState.instances).toHaveLength(1));
		act(() => mapState.handlers.get("load")?.());
		expect(mapState.setData).toHaveBeenCalledWith(
			toFacilityFeatureCollection([{ ...included, gamesLast28Days: 5 }]),
		);
		mapState.setData.mockClear();
		layersState.supplyMetric = "facilities";
		rerender();
		expect(mapState.setData).toHaveBeenCalledWith(
			toFacilityFeatureCollection([{ ...included, gamesLast28Days: 5 }]),
		);
		mapState.setData.mockClear();
		layersState.supplyMetric = "games";
		layersState.gameDepartments = [];
		rerender();
		expect(mapState.setData).toHaveBeenCalledWith(
			toFacilityFeatureCollection([included, excluded]),
		);
	});

	it("filters facilities before clustering for each supply selection", async () => {
		const inactive = { ...FACILITY, id: "inactive", isActive: false, isActiveLastWeek: false };
		mockUseFacilities.mockReturnValue({
			data: [FACILITY, inactive],
			isPending: false,
			isError: false,
		});
		const { result, rerender } = renderRules();
		await waitFor(() => expect(mapState.instances).toHaveLength(1));
		act(() => mapState.handlers.get("load")?.());
		layersState.showInactiveFacilities = false;
		rerender();
		expect(mapState.setData).toHaveBeenLastCalledWith(toFacilityFeatureCollection([FACILITY]));
		expect(result.current.shownFacilities).toEqual([FACILITY]);
		expect(result.current.facilities).toEqual([FACILITY, inactive]);
		layersState.showActiveFacilities = false;
		layersState.showInactiveFacilities = true;
		rerender();
		expect(mapState.setData).toHaveBeenLastCalledWith(toFacilityFeatureCollection([inactive]));
		expect(result.current.shownFacilities).toEqual([inactive]);
		layersState.showInactiveFacilities = false;
		rerender();
		expect(mapState.setData).toHaveBeenLastCalledWith(toFacilityFeatureCollection([]));
		expect(result.current.shownFacilities).toEqual([]);
		layersState.showActiveFacilities = true;
		layersState.showInactiveFacilities = true;
		rerender();
		expect(mapState.setData).toHaveBeenLastCalledWith(
			toFacilityFeatureCollection([FACILITY, inactive]),
		);
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
			expect.objectContaining({
				cluster: true,
				clusterRadius: 40,
				clusterProperties: {
					[CLUSTER_ACTIVE_COUNT_KEY]: CLUSTER_ACTIVE_COUNT_EXPRESSION,
					gameCount: ["+", ["get", "gamesLast28Days"]],
					gamePreviousCount: ["+", ["get", "gamesPrevious28Days"]],
				},
			}),
		);
		await waitFor(() => expect(map?.addLayer).toHaveBeenCalledTimes(5));
		expect(mockUsePleiLogoImages).toHaveBeenLastCalledWith(map);
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
					"symbol-sort-key": ["case", ["==", ["get", "isActive"], true], 1, 0],
				}),
			}),
		);
		expect(map?.addLayer).toHaveBeenCalledWith(
			expect.objectContaining({ id: APP_SESSION_HEATMAP_LAYER_ID, type: "heatmap" }),
		);
		expect(map?.addLayer).toHaveBeenCalledWith(
			expect.objectContaining({
				id: FACILITIES_LAYER_ID,
				layout: { "circle-sort-key": ["case", ["==", ["get", "isActive"], true], 1, 0] },
			}),
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
			x: 200,
			y: 80,
			flipX: false,
			flipY: false,
			viewport: { width: 1000, height: 800 },
		});
		expect(mockPrefetchFacilityStats).toHaveBeenCalledWith(queryClient, "f1");
		act(() => mapState.handlers.get(`mousemove:${FACILITIES_LAYER_ID}`)?.(event("missing")));
		expect(result.current.hovered).toBeNull();

		act(() => mapState.handlers.get(`mousemove:${FACILITIES_LAYER_ID}`)?.(event("f1")));
		act(() => mapState.handlers.get("movestart")?.());
		expect(result.current.hovered).toBeNull();

		act(() => mapState.handlers.get(`mousemove:${FACILITIES_LAYER_ID}`)?.(event("f1")));
		act(() => mapState.handlers.get(`mouseleave:${FACILITIES_LAYER_ID}`)?.());
		expect(result.current.hovered).toMatchObject({ kind: "facility", facility: FACILITY });
		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, CLUSTER_HOVER_DISMISS_MS + 30));
		});
		expect(result.current.hovered).toBeNull();
	});

	it("keeps the facility card anchored when the pointer moves inside the same dot", async () => {
		const { result } = renderRules();
		await waitFor(() => expect(mapState.instances).toHaveLength(1));
		act(() => mapState.handlers.get("load")?.());
		await waitFor(() =>
			expect(mapState.handlers.has(`mousemove:${FACILITIES_LAYER_ID}`)).toBe(true),
		);
		const move = (point: { x: number; y: number }) => {
			mapState.handlers.get(`mousemove:${FACILITIES_LAYER_ID}`)?.({
				features: [{ properties: { id: "f1" } }],
				point,
			});
		};

		act(() => move({ x: 120, y: 80 }));
		expect(result.current.hovered).toMatchObject({ kind: "facility", x: 200, y: 80 });
		act(() => move({ x: 180, y: 140 }));
		expect(result.current.hovered).toMatchObject({ kind: "facility", x: 200, y: 80 });
	});

	it("preserves facility hover and detail click while Games is selected", async () => {
		mockSupplyFlag.mockReturnValue(true);
		layersState.supplyMetric = "games";
		const { result } = renderRules();
		await waitFor(() => expect(mapState.instances).toHaveLength(1));
		act(() => mapState.handlers.get("load")?.());
		const event = { features: [{ properties: { id: "f1" } }], point: { x: 120, y: 80 } };
		act(() => mapState.handlers.get(`mousemove:${FACILITIES_LAYER_ID}`)?.(event));
		expect(result.current.hovered).toMatchObject({ kind: "facility", facility: FACILITY });
		act(() => mapState.handlers.get(`click:${FACILITIES_LAYER_ID}`)?.(event));
		expect(result.current.selectedFacilityId).toBe("f1");
	});

	it("opens the detail panel on facility click and closes it with an animation", async () => {
		const { result } = renderRules();
		await waitFor(() => expect(mapState.instances).toHaveLength(1));
		const map = mapState.instances[0];
		if (!map) throw new Error("map was not created");
		expect(mapState.canvas.style.cursor).toBe(MAP_CURSOR.navigate);
		expect(map?.options).toMatchObject({ dragPan: true });
		act(() => mapState.handlers.get("load")?.());
		await waitFor(() => expect(mapState.handlers.has(`click:${FACILITIES_LAYER_ID}`)).toBe(true));
		const event = (id: unknown) => ({ features: [{ properties: { id } }], point: { x: 1, y: 1 } });

		act(() => mapState.handlers.get(`mouseenter:${FACILITIES_LAYER_ID}`)?.());
		expect(mapState.canvas.style.cursor).toBe(MAP_CURSOR.interactive);

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

		act(() => mapState.handlers.get(`click:${FACILITIES_LAYER_ID}`)?.(event("f1")));
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

		act(() => mapState.handlers.get(`mousemove:${FACILITIES_LAYER_ID}`)?.(event("f1")));
		act(() => mapState.handlers.get(`click:${FACILITIES_LAYER_ID}`)?.(event("f1")));
		expect(result.current.selectedFacilityId).toBe("f1");
		map.queryRenderedFeatures = vi.fn(() => [{ properties: { id: "f1" } }]);
		act(() => mapState.handlers.get("click")?.({ point: { x: 10, y: 10 } }));
		expect(result.current.isPanelClosing).toBe(false);
		map.queryRenderedFeatures = vi.fn(() => []);
		act(() => mapState.handlers.get("click")?.({ point: { x: 10, y: 10 } }));
		expect(result.current.isPanelClosing).toBe(true);

		act(() => result.current.handlePanelClosed());
		act(() => mapState.handlers.get(`mouseleave:${FACILITIES_LAYER_ID}`)?.());
		expect(mapState.canvas.style.cursor).toBe(MAP_CURSOR.navigate);

		act(() => mapState.handlers.get("dragstart")?.());
		expect(map?.stop).not.toHaveBeenCalled();
		expect(mapState.canvas.style.cursor).toBe(MAP_CURSOR.dragging);
		act(() =>
			mapState.handlers.get(`mousemove:${FACILITIES_LAYER_ID}`)?.({
				features: [{ properties: { id: "f1" } }],
				point: { x: 1, y: 1 },
			}),
		);
		expect(result.current.hovered).toBeNull();
		act(() => mapState.handlers.get("dragend")?.());
		expect(mapState.canvas.style.cursor).toBe(MAP_CURSOR.navigate);
	});

	it("fits a searched city's bounds, or centers on it when it has none, and clears the scope", async () => {
		const { result } = renderRules();
		await waitFor(() => expect(mapState.instances).toHaveLength(1));
		act(() => mapState.handlers.get("load")?.());
		const map = mapState.instances[0];
		const wichita = {
			id: "R123",
			name: "Wichita",
			kind: "city" as const,
			context: "Kansas, United States",
			location: { latitude: 37.69, longitude: -97.34 },
			bounds: [-97.73, 37.48, -97.15, 37.84] as [number, number, number, number],
		};

		act(() => result.current.selectSearchPlace(wichita));
		expect(map?.fitBounds).toHaveBeenLastCalledWith(
			[
				[-97.73, 37.48],
				[-97.15, 37.84],
			],
			{ padding: 72, maxZoom: 11, duration: 700 },
		);
		expect(result.current.selectedFacilityId).toBeNull();

		act(() => result.current.selectSearchPlace({ ...wichita, bounds: null }));
		expect(map?.easeTo).toHaveBeenLastCalledWith({
			center: [-97.34, 37.69],
			zoom: 11,
			duration: 700,
		});
	});

	it("zooms to facilities and fits markets selected from search", async () => {
		const { result } = renderRules();
		await waitFor(() => expect(mapState.instances).toHaveLength(1));
		act(() => mapState.handlers.get("load")?.());
		const map = mapState.instances[0];
		act(() => result.current.selectSearchFacility(FACILITY));
		expect(result.current.selectedFacilityId).toBe("f1");
		expect(map?.easeTo).toHaveBeenLastCalledWith(
			expect.objectContaining({ center: [-97.74, 30.27], zoom: 14 }),
		);
		const second = { ...FACILITY, id: "f2", location: { latitude: 31, longitude: -96 } };
		act(() =>
			result.current.selectSearchMarket({
				id: "austin",
				name: "Austin",
				facilities: [FACILITY, second],
			}),
		);
		expect(map?.fitBounds).toHaveBeenCalledWith(
			[
				[-97.74, 30.27],
				[-96, 31],
			],
			{ padding: 72, maxZoom: 11, duration: 700 },
		);
		act(() =>
			result.current.selectSearchMarket({ id: "austin", name: "Austin", facilities: [FACILITY] }),
		);
		expect(map?.easeTo).toHaveBeenLastCalledWith(expect.objectContaining({ zoom: 11 }));
		act(() => result.current.selectSearchMarket({ id: "empty", name: "Empty", facilities: [] }));
	});

	it("shares the searched facility or market as the summary scope and resets it on clear", async () => {
		const container = document.createElement("div");
		const { result } = renderHook(
			() => {
				const rules = useFacilitiesMapScreenRules();
				rules.containerRef.current ??= container;
				return {
					rules,
					scope: useMapScope().scope,
					feedbackFacilityId: useMapScope().selectedFacilityId,
				};
			},
			{
				wrapper: ({ children }: { children: ReactNode }) =>
					wrapper({ children: createElement(MapScopeProvider, null, children) }),
			},
		);
		await waitFor(() => expect(mapState.instances).toHaveLength(1));
		act(() => mapState.handlers.get("load")?.());
		expect(result.current.scope).toEqual({ kind: "all" });

		act(() => result.current.rules.selectSearchFacility(FACILITY));
		expect(result.current.feedbackFacilityId).toBe("f1");
		expect(result.current.scope).toEqual({
			kind: "facility",
			id: "f1",
			name: FACILITY.name,
			marketName: "Austin",
		});

		act(() =>
			result.current.rules.selectSearchMarket({
				id: "austin",
				name: "Austin",
				facilities: [FACILITY],
			}),
		);
		expect(result.current.scope).toEqual({ kind: "market", id: "austin", name: "Austin" });

		act(() => result.current.rules.clearSearchScope());
		expect(result.current.scope).toEqual({ kind: "all" });
		act(() => result.current.rules.handlePanelClosed());
		expect(result.current.feedbackFacilityId).toBeNull();
	});

	it("zooms to search selections", async () => {
		const { result } = renderRules();
		await waitFor(() => expect(mapState.instances).toHaveLength(1));
		act(() => mapState.handlers.get("load")?.());
		const map = mapState.instances[0];
		const secondFacility = {
			...FACILITY,
			id: "f2",
			location: { latitude: 30.4, longitude: -97.6 },
		};

		act(() => result.current.selectSearchFacility(FACILITY));
		expect(result.current.selectedFacilityId).toBe("f1");
		expect(map?.easeTo).toHaveBeenLastCalledWith({
			center: [-97.74, 30.27],
			zoom: 14,
			padding: { top: 0, bottom: 0, left: 0, right: 384 },
			duration: 700,
		});

		act(() =>
			result.current.selectSearchMarket({
				id: "austin",
				name: "Austin",
				facilities: [FACILITY, secondFacility],
			}),
		);
		expect(result.current.selectedFacilityId).toBeNull();
		expect(map?.fitBounds).toHaveBeenCalledWith(
			[
				[-97.74, 30.27],
				[-97.6, 30.4],
			],
			{ padding: 72, maxZoom: 11, duration: 700 },
		);

		act(() =>
			result.current.selectSearchMarket({
				id: "austin",
				name: "Austin",
				facilities: [FACILITY],
			}),
		);
		expect(map?.easeTo).toHaveBeenLastCalledWith({
			center: [-97.74, 30.27],
			zoom: 11,
			padding: { top: 0, bottom: 0, left: 0, right: 0 },
			duration: 700,
		});

		act(() => result.current.selectSearchMarket({ id: "empty", name: "Empty", facilities: [] }));
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
		expect(mapState.canvas.style.cursor).toBe(MAP_CURSOR.interactive);
		act(() => mapState.handlers.get(`mouseleave:${CLUSTER_LAYER_ID}`)?.());
		expect(mapState.canvas.style.cursor).toBe(MAP_CURSOR.navigate);

		await act(async () => {
			mapState.handlers.get(`mousemove:${CLUSTER_LAYER_ID}`)?.(clusterEvent(10));
		});
		expect(mapState.getClusterLeaves).toHaveBeenCalledWith(7, 12, 0);
		expect(result.current.hovered).toEqual({
			kind: "cluster",
			clusterId: 7,
			total: 12,
			facilities: [FACILITY],
			x: 200,
			y: 80,
			flipX: false,
			flipY: false,
			viewport: { width: 1000, height: 800 },
		});

		act(() => mapState.handlers.get(`mousemove:${CLUSTER_LAYER_ID}`)?.(clusterEvent(30)));
		expect(mapState.getClusterLeaves).toHaveBeenCalledTimes(1);
		expect(result.current.hovered).toMatchObject({
			x: 200,
			y: 80,
			facilities: [FACILITY],
		});

		act(() => mapState.handlers.get(`mousemove:${CLUSTER_LAYER_ID}`)?.(clusterEvent(30, "bad")));
		expect(result.current.hovered).toMatchObject({ clusterId: 7 });

		await act(async () => {
			mapState.handlers.get(`click:${CLUSTER_LAYER_ID}`)?.(clusterEvent(30));
		});
		expect(result.current.hovered).toBeNull();
		expect(map?.easeTo).toHaveBeenCalledWith({ center: [-97.7, 30.3], zoom: 9, duration: 500 });

		act(() => mapState.handlers.get(`click:${CLUSTER_LAYER_ID}`)?.(clusterEvent(30, null)));
		expect(map?.easeTo).toHaveBeenCalledTimes(1);

		mapState.getClusterLeaves.mockResolvedValue([
			{
				properties: { id: "f1", isActive: true, isActiveLastWeek: true },
				geometry: { coordinates: [-97.1, 30.4] },
			},
		]);
		mapState.getClusterChildren.mockResolvedValue([
			{
				properties: { id: "f1", isActive: true, isActiveLastWeek: true },
				geometry: { coordinates: [-97.1, 30.4] },
			},
		]);
		mapState.getClusterExpansionZoom.mockResolvedValue(12);
		await act(async () => {
			mapState.handlers.get(`click:${CLUSTER_LAYER_ID}`)?.({
				features: [
					{
						properties: { cluster_id: 7, point_count: 12, activeCount: 2 },
						geometry: { type: "Point", coordinates: [-97.7, 30.3] },
					},
				],
				point: { x: 30, y: 40 },
			});
		});
		expect(map?.easeTo).toHaveBeenLastCalledWith({
			center: [-97.1, 30.4],
			zoom: 12,
			duration: 500,
		});
	});

	it("keeps the cluster card open while the pointer moves onto it", async () => {
		const { result } = renderRules();
		await waitFor(() => expect(mapState.instances).toHaveLength(1));
		act(() => mapState.handlers.get("load")?.());
		await waitFor(() => expect(mapState.handlers.has(`mousemove:${CLUSTER_LAYER_ID}`)).toBe(true));
		const map = mapState.instances[0];
		mapState.getClusterLeaves.mockResolvedValue([{ properties: { id: "f1" } }]);
		const clusterEvent = {
			features: [
				{
					properties: { cluster_id: 7, point_count: 12 },
					geometry: { type: "Point", coordinates: [-97.7, 30.3] },
				},
			],
			point: { x: 10, y: 40 },
		};

		await act(async () => {
			mapState.handlers.get(`mousemove:${CLUSTER_LAYER_ID}`)?.(clusterEvent);
		});
		act(() => mapState.handlers.get(`mouseleave:${CLUSTER_LAYER_ID}`)?.());
		expect(result.current.hovered).toMatchObject({ kind: "cluster", clusterId: 7 });

		act(() => result.current.holdClusterHover());
		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, CLUSTER_HOVER_DISMISS_MS + 30));
		});
		expect(result.current.hovered).toMatchObject({ kind: "cluster", clusterId: 7 });

		act(() => result.current.releaseClusterHover());
		expect(result.current.hovered).toMatchObject({ kind: "cluster", clusterId: 7 });
		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, CLUSTER_HOVER_DISMISS_MS + 30));
		});
		expect(result.current.hovered).toBeNull();

		await act(async () => {
			mapState.handlers.get(`mousemove:${CLUSTER_LAYER_ID}`)?.(clusterEvent);
		});
		act(() => result.current.selectFacility(FACILITY));
		expect(result.current.selectedFacilityId).toBe("f1");
		expect(result.current.hovered).toBeNull();
		expect(FACILITY_DOT_ZOOM).toBe(CLUSTER_MAX_ZOOM + 1);
		expect(clusterListZoom(4)).toBeGreaterThanOrEqual(FACILITY_DOT_ZOOM);
		expect(clusterListZoom(15)).toBe(15);
		expect(map?.easeTo).toHaveBeenCalledWith({
			center: [-97.74, 30.27],
			zoom: FACILITY_DOT_ZOOM,
			padding: { top: 0, bottom: 0, left: 0, right: 384 },
			duration: 600,
		});

		act(() => result.current.handlePanelClosed());
		const easeTo = map?.easeTo;
		if (!map || !easeTo) throw new Error("map was not created");
		map.getZoom = vi.fn(() => 15);
		easeTo.mockClear();
		act(() => result.current.selectFacility(FACILITY));
		expect(easeTo).toHaveBeenCalledWith({
			center: [-97.74, 30.27],
			padding: { top: 0, bottom: 0, left: 0, right: 384 },
			duration: 600,
		});
	});

	it("hides the session heatmap and its legend when app sessions are off", async () => {
		const { result, rerender } = renderRules();
		await waitFor(() => expect(mapState.instances).toHaveLength(1));
		const map = mapState.instances[0];
		if (!map) throw new Error("map was not created");
		map.getLayer = vi.fn(() => ({ id: APP_SESSION_HEATMAP_LAYER_ID }));
		map.setLayoutProperty = vi.fn();
		act(() => mapState.handlers.get("load")?.());

		expect(result.current.hasSessionHeatmap).toBe(true);
		expect(result.current.isLegendShown).toBe(true);
		expect(result.current.legendMotionClass).toBe("session-legend-in");

		layersState.showSessions = false;
		rerender();
		expect(map.setLayoutProperty).toHaveBeenCalledWith(
			APP_SESSION_HEATMAP_LAYER_ID,
			"visibility",
			"none",
		);
		expect(result.current.hasSessionHeatmap).toBe(false);
		expect(result.current.isLegendShown).toBe(true);
		expect(result.current.legendMotionClass).toBe("session-legend-out");

		layersState.showSessions = true;
		rerender();
		expect(map.setLayoutProperty).toHaveBeenCalledWith(
			APP_SESSION_HEATMAP_LAYER_ID,
			"visibility",
			"visible",
		);
		expect(result.current.hasSessionHeatmap).toBe(true);
	});

	it("fades facility markers in and out with the facilities switch", async () => {
		const { rerender, unmount } = renderRules();
		await waitFor(() => expect(mapState.instances).toHaveLength(1));
		const map = mapState.instances[0];
		if (!map) throw new Error("map was not created");
		const container = document.createElement("div");
		map.getContainer = vi.fn(() => container);
		map.getCanvasContainer = vi.fn(() => container);
		map.getLayer = vi.fn(() => ({ id: "facilities" }));
		map.setLayoutProperty = vi.fn();
		map.queryRenderedFeatures = vi.fn(() => []);
		map.project = vi.fn(() => ({ x: 0, y: 0 }));
		act(() => mapState.handlers.get("load")?.());
		const cluster = container.querySelector("[data-testid='cluster-glass']");
		const facility = container.querySelector("[data-testid='facility-glass']");
		if (!(cluster instanceof HTMLElement) || !(facility instanceof HTMLElement)) {
			throw new Error("facility glass hosts were not mounted");
		}

		layersState.showActiveFacilities = false;
		layersState.showInactiveFacilities = false;
		rerender();
		expect(cluster.classList.contains("facility-layer-out")).toBe(true);
		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, FACILITY_LAYER_EXIT_MS + 30));
		});
		expect(map?.triggerRepaint).toHaveBeenCalled();
		expect(cluster.style.opacity).toBe("0");

		layersState.showActiveFacilities = true;
		layersState.showInactiveFacilities = true;
		rerender();
		expect(cluster.classList.contains("facility-layer-in")).toBe(true);
		expect(facility.classList.contains("facility-layer-in")).toBe(true);
		expect(map?.setLayoutProperty).toHaveBeenCalledWith(
			expect.any(String),
			"visibility",
			"visible",
		);

		act(() => {
			cluster.dispatchEvent(new Event("animationend"));
		});
		expect(cluster.classList.contains("facility-layer-in")).toBe(false);
		expect(facility.classList.contains("facility-layer-in")).toBe(true);
		act(() => {
			cluster.dispatchEvent(new Event("animationend"));
		});
		act(() => {
			facility.dispatchEvent(new Event("animationend"));
		});
		expect(facility.classList.contains("facility-layer-in")).toBe(false);
		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, FACILITY_LAYER_ENTER_MS + 30));
		});

		layersState.showActiveFacilities = false;
		layersState.showInactiveFacilities = false;
		rerender();
		expect(cluster.classList.contains("facility-layer-out")).toBe(true);
		act(() => {
			cluster.dispatchEvent(new Event("animationend"));
		});
		expect(cluster.style.opacity).toBe("0");
		expect(cluster.classList.contains("facility-layer-out")).toBe(false);
		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, FACILITY_LAYER_EXIT_MS + 30));
		});
		unmount();
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
			await new Promise((resolve) => setTimeout(resolve, CLUSTER_HOVER_DISMISS_MS + 30));
		});
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

	it("keeps the plain markers until the logos are loaded", async () => {
		mockUsePleiLogoImages.mockReturnValue(false);
		renderRules();
		await waitFor(() => expect(mapState.instances).toHaveLength(1));
		act(() => mapState.handlers.get("load")?.());
		await act(async () => undefined);

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

		expect(map?.off).toHaveBeenCalledTimes(14);
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

	it("refetches the heatmap when retry is requested", async () => {
		const refetch = vi.fn();
		mockUseAppSessionHeatmap.mockReturnValue({
			data: undefined,
			isPending: false,
			isError: true,
			refetch,
		});
		const { result } = renderRules();
		expect(result.current.sessionQueryFailed).toBe(true);
		act(() => result.current.retrySessionHeatmap());
		expect(refetch).toHaveBeenCalled();
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
	it.each([
		[
			{ gender: ["male", "female"], skill: ["Beginner", "Expert"], ageMin: 18, ageMax: 35 },
			"Male · Female · Beginner · Expert · 18–35",
		],
		[{ gender: "other", skill: "Advanced", ageMin: 21 }, "Other · Advanced · 21+"],
		[{ ageMax: 17 }, "≤ 17"],
		[{ ageMin: 25, ageMax: 25 }, "25"],
	] satisfies [AppSessionFilters, string][])(
		"names the applied demographic cohort %j",
		(filters, summary) => {
			mockDemandFlag.mockReturnValue(true);
			layersState.sessionFilters = filters;
			const { result } = renderRules();
			expect(result.current.sessionFilterSummary).toBe(summary);
			expect(result.current.sessionFilterChips.map((chip) => chip.label).join(" · ")).toBe(summary);
		},
	);

	it("ignores stored session filters when demographics are disabled", () => {
		layersState.sessionFilters = { gender: "Female", skill: "Advanced" };
		mockDemandFlag.mockReturnValue(false);
		const { result } = renderRules();
		expect(result.current.sessionFilterChips).toEqual([]);
		expect(mockUseAppSessionHeatmap).toHaveBeenLastCalledWith({}, "week", true);
	});

	it("removes a demographic chip from the applied cohort", () => {
		mockDemandFlag.mockReturnValue(true);
		const setSessionFilters = vi.fn();
		layersState.setSessionFilters = setSessionFilters;
		layersState.sessionFilters = { gender: ["Female", "Male"], ageMin: 18, ageMax: 34 };
		const { result, rerender } = renderRules();
		act(() => result.current.removeSessionFilter("gender", "female"));
		expect(setSessionFilters).toHaveBeenCalledWith({ gender: ["Male"], ageMin: 18, ageMax: 34 });
		layersState.sessionFilters = { gender: ["Female", "Male"], ageMin: 18, ageMax: 34 };
		rerender();
		act(() => result.current.removeSessionFilter("age", "age"));
		expect(setSessionFilters).toHaveBeenLastCalledWith({ gender: ["Female", "Male"] });
	});
	it("deletes a demographic field when its last chip is removed", () => {
		mockDemandFlag.mockReturnValue(true);
		const setSessionFilters = vi.fn();
		layersState.setSessionFilters = setSessionFilters;
		layersState.sessionFilters = { gender: ["Female"], skill: ["Advanced"] };
		const { result } = renderRules();
		act(() => result.current.removeSessionFilter("gender", "female"));
		expect(setSessionFilters).toHaveBeenCalledWith({ skill: ["Advanced"] });
	});

	it("shows the session legend as loading while app sessions are pending", async () => {
		mockUseAppSessionHeatmap.mockReturnValue({ data: undefined, isPending: true, isError: false });
		const { result } = renderRules();
		await waitFor(() => expect(mapState.instances).toHaveLength(1));
		act(() => mapState.handlers.get("load")?.());

		expect(result.current.hasSessionHeatmap).toBe(false);
		expect(result.current.sessionLegendState).toBe("loading");
		expect(result.current.isLegendShown).toBe(true);
		expect(result.current.legendMotionClass).toBe("session-legend-in");
	});

	it("keeps the session legend loading until the map can draw the heatmap", async () => {
		const { result } = renderRules();
		expect(result.current.sessionLegendState).toBe("loading");

		await waitFor(() => expect(mapState.instances).toHaveLength(1));
		act(() => mapState.handlers.get("load")?.());

		expect(result.current.sessionLegendState).toBe("scale");
	});

	it("reports an empty session legend when loaded sessions have no weight", async () => {
		mockUseAppSessionHeatmap.mockReturnValue({
			data: [{ lat: 29.75, lng: -95.35, sessionWeight: 0 }],
			isPending: false,
			isError: false,
		});
		const { result } = renderRules();
		await waitFor(() => expect(mapState.instances).toHaveLength(1));
		act(() => mapState.handlers.get("load")?.());

		expect(result.current.sessionLegendState).toBe("empty");
	});

	it.each([
		[{ data: undefined, isPending: false, isError: true }, true],
		[{ data: undefined, isPending: true, isError: false }, false],
	])("does not report loading for failed or hidden sessions %#", (heatmap, showSessions) => {
		layersState.showSessions = showSessions;
		mockUseAppSessionHeatmap.mockReturnValue(heatmap);
		const { result } = renderRules();
		expect(result.current.sessionLegendState).not.toBe("loading");
		expect(result.current.isLegendShown).toBe(false);
	});
	it("loads registrations with the applied cohort and changes all legend labels", async () => {
		mockDemandFlag.mockReturnValue(true);
		layersState.demandMetric = "registrations";
		layersState.sessionFilters = { gender: "Female", ageMin: 18 };
		const { result, rerender } = renderRules();
		await waitFor(() => expect(mapState.instances).toHaveLength(1));
		act(() => mapState.handlers.get("load")?.());
		expect(mockUseAppSessionHeatmap).toHaveBeenLastCalledWith(
			{ gender: "Female", ageMin: 18, metric: "registrations" },
			"week",
			true,
		);
		expect(result.current.messages.sessionHeatmapLegend).toContain("Registrations per market");
		expect(result.current.sessionHeatmapLegend).toBe(EN_MESSAGES.map.registrationHeatmapLegend);
		expect(mapState.instances[0]?.setPaintProperty).toHaveBeenCalledWith(
			APP_SESSION_HEATMAP_LAYER_ID,
			"heatmap-intensity",
			REGISTRATION_HEATMAP_PAINT?.["heatmap-intensity"],
		);
		expect(result.current.messages.sessionHeatmapLoading).toBe("Loading user registrations…");
		expect(result.current.messages.sessionHeatmapLowValue).toContain("registrations");
		mockUseAppSessionHeatmap.mockReturnValue({ data: [], isPending: false, isError: false });
		rerender();
		expect(result.current.sessionLegendState).toBe("empty");
		expect(result.current.isLegendShown).toBe(true);
		mockDemandFlag.mockReturnValue(false);
		rerender();
		expect(mockUseAppSessionHeatmap).toHaveBeenLastCalledWith({}, "week", true);
		expect(result.current.messages.sessionHeatmapLegend).toBe(EN_MESSAGES.map.sessionHeatmapLegend);
		expect(mapState.instances[0]?.setPaintProperty).toHaveBeenCalledWith(
			APP_SESSION_HEATMAP_LAYER_ID,
			"heatmap-intensity",
			APP_SESSION_HEATMAP_PAINT?.["heatmap-intensity"],
		);
	});
});

it("uses individual market counts for registrations even when markets share a viewport area", () => {
	const cells = [
		{ lat: 1, lng: 1, sessionWeight: 100 },
		{ lat: 1.01, lng: 1.01, sessionWeight: 200 },
	];
	const bounds = {
		contains: () => true,
		getWest: () => 0,
		getEast: () => 24,
		getSouth: () => 0,
		getNorth: () => 16,
	};
	expect(appSessionHeatmapScale(cells, bounds)).toEqual({ low: 300, high: 300 });
	expect(appSessionHeatmapScale(cells, bounds, false)).toEqual({ low: 100, high: 200 });
});

it("uses summed game counts for clusters and game counts for individual facility badges", () => {
	const project = () => ({ x: 1, y: 2 });
	const features = [
		{
			geometry: { coordinates: [1, 2] },
			properties: { cluster_id: 7, point_count: 2, gameCount: 90, activeCount: 2 },
		},
	];
	expect(readClusterGlassBadges(features, project, true)[0]?.label).toBe("90");
	expect(readClusterGlassBadges(features, project)[0]?.label).toBe("2");
	const facilities = [
		{
			geometry: { coordinates: [1, 2] },
			properties: { id: "a", isActive: true, gamesLast28Days: 40 },
		},
	];
	expect(readFacilityGlassBadges(facilities, project, true)[0]?.label).toBe("40");
	const host = document.createElement("div");
	const nodes = new Map<string, HTMLElement>();
	syncFacilityGlass(host, readFacilityGlassBadges(facilities, project, true), nodes, "a");
	expect(host.querySelector('[data-testid="facility-glass-label"]')).toHaveTextContent("40");
	expect(host.querySelector('[data-testid="facility-glass-core"]')).toHaveStyle({
		display: "none",
	});
	expect(nodes.get("a")).toHaveStyle({ pointerEvents: "none" });
	syncFacilityGlass(host, readFacilityGlassBadges(facilities, project), nodes);
	expect(host.querySelector('[data-testid="facility-glass-label"]')).toHaveStyle({
		display: "none",
	});
	expect(
		host.querySelector<HTMLElement>('[data-testid="facility-glass-core"]')?.style.display,
	).toBe("");
});

it.each([
	[999, "999"],
	[1000, "1K"],
	[1400, "1.4K"],
	[1456, "1.5K"],
	[1000000, "1M"],
])("formats %s games as %s on clusters and individual facilities", (count, label) => {
	const project = () => ({ x: 0, y: 0 });
	expect(
		readClusterGlassBadges(
			[
				{
					geometry: { coordinates: [1, 2] },
					properties: { cluster_id: 1, point_count: 2, gameCount: count },
				},
			],
			project,
			true,
		)[0]?.label,
	).toBe(label);
	expect(
		readFacilityGlassBadges(
			[{ geometry: { coordinates: [1, 2] }, properties: { id: "a", gamesLast28Days: count } }],
			project,
			true,
		)[0]?.label,
	).toBe(label);
});

describe("games trend", () => {
	const growing = sameInBothPeriods({
		...FACILITY,
		gamesLast28Days: 46,
		gamesPrevious28Days: 40,
		gamesByDepartment: { magic: 40, organizers: 6, partnerships: 0 },
		gamesPreviousByDepartment: { magic: 20, organizers: 20, partnerships: 0 },
	});
	const stopped = sameInBothPeriods({
		...FACILITY,
		id: "stopped",
		gamesLast28Days: 0,
		gamesPrevious28Days: 9,
		gamesByDepartment: { magic: 0, organizers: 0, partnerships: 0 },
		gamesPreviousByDepartment: { magic: 0, organizers: 9, partnerships: 0 },
	});
	const neverPlayed = sameInBothPeriods({
		...FACILITY,
		id: "never",
		gamesLast28Days: 0,
		gamesPrevious28Days: 0,
	});
	const base = {
		showGames: true,
		showTrend: false,
		showActiveFacilities: true,
		showInactiveFacilities: true,
	};

	it("keeps the Games map unchanged while trend is off", () => {
		expect(facilitiesForMap([growing, stopped, neverPlayed], base)).toEqual([growing]);
	});

	it("keeps facilities that dropped to zero on the map while trend is on", () => {
		expect(facilitiesForMap([growing, stopped, neverPlayed], { ...base, showTrend: true })).toEqual(
			[growing, stopped],
		);
		expect(
			facilitiesForMap([growing, stopped], {
				...base,
				showTrend: true,
				showActiveFacilities: false,
			}),
		).toEqual([]);
	});

	it("applies selected departments to both windows", () => {
		const options = { ...base, showTrend: true, gameDepartments: ["organizers"] as const };
		expect(facilitiesForMap([growing, stopped, neverPlayed], options)).toEqual([
			{ ...growing, gamesLast28Days: 6, gamesPrevious28Days: 20 },
			{ ...stopped, gamesLast28Days: 0, gamesPrevious28Days: 9 },
		]);
		expect(
			facilitiesForMap([growing, stopped], { ...options, showTrend: false }).map((f) => f.id),
		).toEqual(["f1"]);
		expect(
			facilitiesForMap([growing, stopped], { ...options, gameDepartments: ["partnerships"] }),
		).toEqual([]);
		expect(
			facilitiesForMap([{ ...FACILITY, gamesLast28Days: 3 }], {
				...options,
				gameDepartments: ["magic"],
			}),
		).toEqual([]);
	});

	it("leaves the Facilities map to the active and inactive toggles", () => {
		const inactive = { ...neverPlayed, id: "inactive", isActive: false };
		const options = { ...base, showGames: false, showTrend: false };
		expect(facilitiesForMap([growing, inactive], options)).toEqual([growing, inactive]);
		expect(
			facilitiesForMap([growing, inactive], { ...options, showInactiveFacilities: false }),
		).toEqual([growing]);
	});

	it("builds hover trends from facility counts and cluster sums", () => {
		expect(facilityTrend(42, 51)).toEqual({
			level: "down",
			current: 42,
			previous: 51,
			change: -9,
			percentChange: -18,
		});
		expect(facilityTrend(undefined, undefined).level).toBe("stable");
		expect(clusterTrend({ gameCount: 130, gamePreviousCount: 100 } as never)).toMatchObject({
			level: "up",
			change: 30,
		});
		expect(clusterTrend({ gameCount: "7", gamePreviousCount: "bad" } as never)).toMatchObject({
			current: 7,
			previous: 0,
			level: "up",
		});
		expect(clusterTrend(undefined).level).toBe("stable");
	});

	describe("on the map", () => {
		beforeEach(() => {
			vi.clearAllMocks();
			Object.assign(layersState, {
				showActiveFacilities: true,
				showInactiveFacilities: true,
				showSessions: true,
				hasProvider: true,
				demandMetric: "sessions",
				supplyMetric: "games",
				gameDepartments: [],
				showGamesTrend: false,
				sessionFilters: {},
			});
			mockSupplyFlag.mockReturnValue(true);
			mockDemandFlag.mockReturnValue(false);
			mapState.instances.length = 0;
			mapState.handlers.clear();
			mockUseFacilities.mockReturnValue({
				data: [growing, stopped, neverPlayed],
				isPending: false,
				isError: false,
			});
			mockUseAppSessionHeatmap.mockReturnValue({ data: [], isPending: false, isError: false });
			mockUsePleiLogoImages.mockImplementation((map: unknown) => map !== null);
		});

		async function loadMap() {
			const rendered = renderRules();
			await waitFor(() => expect(mapState.instances).toHaveLength(1));
			const instance = mapState.instances[0];
			if (!instance) throw new Error("Expected a map");
			const map = instance as Record<"addLayer" | "setLayoutProperty", ReturnType<typeof vi.fn>>;
			map.setLayoutProperty = vi.fn();
			act(() => mapState.handlers.get("load")?.());
			await waitFor(() =>
				expect(mapState.handlers.has(`mousemove:${FACILITIES_LAYER_ID}`)).toBe(true),
			);
			return { ...rendered, map };
		}

		it("adds no map layers for the trend", async () => {
			const { map, result } = await loadMap();

			expect(map.addLayer).toHaveBeenCalledTimes(5);
			expect(result.current.showTrend).toBe(false);
			expect(result.current.selectedTrend).toBeNull();
		});

		it("turns trend on with one setData and no layer changes, and back off", async () => {
			const { map, rerender, result } = await loadMap();
			mapState.setData.mockClear();
			map.setLayoutProperty.mockClear();

			layersState.showGamesTrend = true;
			rerender();

			expect(result.current.showTrend).toBe(true);
			expect(mapState.setData).toHaveBeenCalledTimes(1);
			expect(mapState.setData).toHaveBeenCalledWith(
				toFacilityFeatureCollection([growing, stopped]),
			);
			expect(map.setLayoutProperty).not.toHaveBeenCalled();

			layersState.showGamesTrend = false;
			rerender();
			expect(result.current.showTrend).toBe(false);
			expect(map.setLayoutProperty).not.toHaveBeenCalled();
		});

		it("shows the trend only with Games selected, never in Facilities mode", async () => {
			layersState.showGamesTrend = true;
			const { rerender, result } = await loadMap();
			expect(result.current.showTrend).toBe(true);

			layersState.supplyMetric = "facilities";
			rerender();
			expect(result.current.showTrend).toBe(false);
			expect(mapState.setData).toHaveBeenLastCalledWith(
				toFacilityFeatureCollection([growing, stopped, neverPlayed]),
			);

			layersState.supplyMetric = "games";
			mockSupplyFlag.mockReturnValue(false);
			rerender();
			expect(result.current.showTrend).toBe(false);
		});

		it("keeps the trend off while its flag or the games flag is off", async () => {
			onTestFinished(() => {
				mockTrendFlag.mockReturnValue(true);
			});
			layersState.showGamesTrend = true;
			mockTrendFlag.mockReturnValue(false);
			const { rerender, result } = await loadMap();

			expect(result.current.showTrend).toBe(false);
			expect(result.current.selectedTrend).toBeNull();

			mockTrendFlag.mockReturnValue(true);
			mockSupplyFlag.mockReturnValue(false);
			rerender();
			expect(result.current.showTrend).toBe(false);

			mockSupplyFlag.mockReturnValue(true);
			rerender();
			expect(result.current.showTrend).toBe(true);
		});

		it("keeps trend hovers off with the trend flag off, even with Show trend saved on", async () => {
			onTestFinished(() => {
				mockTrendFlag.mockReturnValue(true);
			});
			layersState.showGamesTrend = true;
			mockTrendFlag.mockReturnValue(false);
			const { rerender, result } = await loadMap();
			mapState.getClusterLeaves.mockResolvedValue([]);

			expect(result.current.showTrend).toBe(false);
			await act(async () => {
				mapState.handlers.get(`mousemove:${CLUSTER_LAYER_ID}`)?.({
					features: [
						{
							properties: { cluster_id: 11, point_count: 2, gameCount: 9, gamePreviousCount: 2 },
							geometry: { type: "Point", coordinates: [-97.7, 30.3] },
						},
					],
					point: { x: 10, y: 40 },
				});
			});
			expect(result.current.hovered).toMatchObject({ kind: "cluster" });
			expect(result.current.hovered).not.toHaveProperty("trend");

			mockTrendFlag.mockReturnValue(true);
			rerender();
			expect(result.current.showTrend).toBe(true);
		});

		it("adds the trend to hovers and the detail panel only while trend is on", async () => {
			const { rerender, result } = await loadMap();
			const hover = (id: string) =>
				act(() =>
					mapState.handlers.get(`mousemove:${FACILITIES_LAYER_ID}`)?.({
						features: [{ properties: { id } }],
						point: { x: 120, y: 80 },
					}),
				);
			const clusterEvent = {
				features: [
					{
						properties: {
							cluster_id: 7,
							point_count: 2,
							gameCount: 46,
							gamePreviousCount: 52,
						},
						geometry: { type: "Point", coordinates: [-97.7, 30.3] },
					},
				],
				point: { x: 10, y: 40 },
			};
			mapState.getClusterLeaves.mockResolvedValue([]);

			hover("f1");
			expect(result.current.hovered).not.toHaveProperty("trend");
			expect(result.current.hovered).toMatchObject({ kind: "facility", games: 46 });
			await act(async () => {
				mapState.handlers.get(`mousemove:${CLUSTER_LAYER_ID}`)?.(clusterEvent);
			});
			expect(result.current.hovered).not.toHaveProperty("trend");

			layersState.showGamesTrend = true;
			rerender();
			hover("stopped");
			expect(result.current.hovered).toMatchObject({
				kind: "facility",
				trend: { level: "down", current: 0, previous: 9, change: -9 },
			});
			const otherCluster = clusterEvent.features[0];
			await act(async () => {
				mapState.handlers.get(`mousemove:${CLUSTER_LAYER_ID}`)?.({
					...clusterEvent,
					features: [
						{ ...otherCluster, properties: { ...otherCluster?.properties, cluster_id: 8 } },
					],
				});
			});
			expect(result.current.hovered).toMatchObject({
				kind: "cluster",
				games: 46,
				trend: { level: "down", current: 46, previous: 52 },
			});

			act(() => result.current.selectFacility(growing));
			expect(result.current.selectedTrend).toMatchObject({
				level: "up",
				current: 46,
				previous: 40,
			});
		});

		it("adds no trend to Facilities mode hovers, even with Show trend saved on", async () => {
			layersState.showGamesTrend = true;
			layersState.supplyMetric = "facilities";
			const { result } = await loadMap();
			expect(result.current.showTrend).toBe(false);
			mapState.getClusterLeaves.mockResolvedValue([]);

			act(() =>
				mapState.handlers.get(`mousemove:${FACILITIES_LAYER_ID}`)?.({
					features: [{ properties: { id: "stopped" } }],
					point: { x: 120, y: 80 },
				}),
			);
			expect(result.current.hovered).toMatchObject({ kind: "facility" });
			expect(result.current.hovered).not.toHaveProperty("trend");
			expect(result.current.hovered).not.toHaveProperty("games");

			await act(async () => {
				mapState.handlers.get(`mousemove:${CLUSTER_LAYER_ID}`)?.({
					features: [
						{
							properties: { cluster_id: 9, point_count: 2, gameCount: 1, gamePreviousCount: 4 },
							geometry: { type: "Point", coordinates: [-97.7, 30.3] },
						},
					],
					point: { x: 10, y: 40 },
				});
			});
			expect(result.current.hovered).toMatchObject({ kind: "cluster" });
			expect(result.current.hovered).not.toHaveProperty("trend");
			act(() => result.current.selectFacility(growing));
			expect(result.current.selectedTrend).toBeNull();
		});
	});
});

describe("period-aware map data", () => {
	it("asks for the selected period's sessions and names it in the legend", () => {
		const { result } = renderRules();

		expect(mockUseAppSessionHeatmap).toHaveBeenLastCalledWith(
			expect.anything(),
			"week",
			expect.any(Boolean),
		);
		expect(result.current.sessionHeatmapLegend).toBe("App session density · last week");
	});

	it("leaves the session reference status empty while demand data is ready", () => {
		mockUseAppSessionHeatmap.mockReturnValue({
			data: [{ lat: 29, lng: -95, sessionWeight: 2 }],
			isPending: false,
			isFetching: false,
			isError: false,
			isSuccess: true,
		});
		layersState.showSessions = true;
		layersState.sessionFilters = {};
		const { result } = renderRules();
		expect(result.current.sessionQueryStatus).toBe("");
	});

	it("names the updating state while sessions reload", () => {
		mockUseAppSessionHeatmap.mockReturnValue({
			data: [{ lat: 29, lng: -95, sessionWeight: 2 }],
			isPending: true,
			isFetching: true,
			isError: false,
			isSuccess: false,
		});
		layersState.showSessions = true;
		const { result } = renderRules();
		expect(result.current.sessionQueryStatus).toBe("Updating demand…");
	});

	it("keeps the legend visible when filters are applied and the heatmap fails", () => {
		mockDemandFlag.mockReturnValue(true);
		layersState.sessionFilters = { gender: ["Female"] };
		mockUseAppSessionHeatmap.mockReturnValue({
			data: [],
			isPending: false,
			isFetching: false,
			isError: true,
			isSuccess: false,
		});
		const { result } = renderRules();
		expect(result.current.isLegendShown).toBe(true);
		expect(result.current.sessionFilterChips).toHaveLength(1);
	});

	it("clears a pending hover dismiss timer on unmount", async () => {
		const { unmount } = renderRules();
		await waitFor(() => expect(mapState.instances).toHaveLength(1));
		act(() => mapState.handlers.get("load")?.());
		act(() =>
			mapState.handlers.get(`mousemove:${FACILITIES_LAYER_ID}`)?.({
				features: [{ properties: { id: "f1" } }],
				point: { x: 1, y: 1 },
			}),
		);
		unmount();
	});

	it("names a heatmap failure for the session reference panel", () => {
		mockUseAppSessionHeatmap.mockReturnValue({
			data: undefined,
			isPending: false,
			isFetching: false,
			isError: true,
			isSuccess: false,
		});
		layersState.showSessions = true;
		const { result } = renderRules();
		expect(result.current.sessionQueryStatus).toBe("Couldn’t load sessions. Try again.");
	});

	it("names an empty filtered result for the session reference panel", () => {
		mockDemandFlag.mockReturnValue(true);
		layersState.sessionFilters = { gender: ["Female"] };
		mockUseAppSessionHeatmap.mockReturnValue({
			data: [],
			isError: false,
			isPending: false,
			isSuccess: true,
			isFetching: false,
		});
		const { result } = renderRules();
		expect(result.current.sessionQueryStatus).toBe("No sessions match these filters.");
		expect(result.current.hasSessionHeatmap).toBe(false);
		expect(result.current.isLegendShown).toBe(true);
	});
});
