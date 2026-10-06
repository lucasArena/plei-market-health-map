import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { AppSessionFilters } from "@market-health-map/core/application";
import { act, renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { EN_MESSAGES } from "@/application/test/messages";
import {
	MapScopeProvider,
	useMapScope,
} from "@/presentation/components/providers/MapScopeProvider/MapScopeProviderComponent";
import { MessagesProvider } from "@/presentation/components/providers/MessagesProvider/MessagesProviderComponent";
import {
	activeClusterRevealTarget,
	applyClusterGlassActivity,
	applyFacilityGlassActivity,
	applyFacilityLayerMotion,
	appSessionHeatmapAreas,
	appSessionHeatmapScale,
	bindFacilityGlass,
	clusterListZoom,
	createClusterGlassNode,
	createFacilityGlassNode,
	FACILITY_LAYER_ENTER_MS,
	FACILITY_LAYER_EXIT_MS,
	facilitiesForIds,
	facilitiesForPeriod,
	marketBounds,
	placeHover,
	readClusterGlassBadges,
	readFacilityGlassBadges,
	resolveMapStatus,
	syncClusterGlass,
	toAppSessionHeatmapFeatureCollection,
	toFacilityFeatureCollection,
	useFacilitiesMapScreenRules,
} from "@/presentation/screens/FacilitiesMapScreen/FacilitiesMapScreenComponent.rules";
import {
	APP_SESSION_HEATMAP_LAYER_ID,
	APP_SESSION_HEATMAP_SOURCE_ID,
	CLUSTER_ACTIVE_COUNT_EXPRESSION,
	CLUSTER_ACTIVE_COUNT_KEY,
	CLUSTER_HOVER_DISMISS_MS,
	CLUSTER_LAYER_ID,
	CLUSTER_MARKER_CLASS,
	CLUSTER_MARKER_HOVER_SCALE,
	CLUSTER_MARKER_MOTION_EASING,
	CLUSTER_MARKER_MOTION_MS,
	CLUSTER_MAX_ZOOM,
	FACILITIES_LAYER_ID,
	FACILITY_DOT_ZOOM,
	selectedRingWidth,
} from "@/presentation/screens/FacilitiesMapScreen/FacilitiesMapScreenComponent.styles";
import type { ClusterTreeSource } from "@/presentation/screens/FacilitiesMapScreen/FacilitiesMapScreenComponent.types";

const mapState = vi.hoisted(() => ({
	instances: [] as Array<Record<string, ReturnType<typeof vi.fn>>>,
	handlers: new Map<string, (...args: unknown[]) => unknown>(),
	canvas: { style: { cursor: "" } },
	setData: vi.fn(),
	getClusterLeaves: vi.fn(),
	getClusterExpansionZoom: vi.fn(),
	getClusterChildren: vi.fn(),
	setWorkerUrl: vi.fn(),
}));
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
		project = vi.fn(() => ({ x: 200, y: 80 }));
		getCanvas = vi.fn(() => mapState.canvas);
		getContainer = vi.fn(() => ({ clientWidth: 1000, clientHeight: 800 }));
		getZoom = vi.fn(() => 4);
		getBounds = vi.fn(() => ({ contains: () => true }));
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
	sessionFilters: {} as AppSessionFilters,
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
					sessionFilters: layersState.sessionFilters,
					setShowSessions: vi.fn(),
				}
			: null,
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

describe("active cluster reveal", () => {
	it("zooms to the nearest active facility once that facility is drawn as its own dot", async () => {
		const source = {
			getClusterExpansionZoom: vi.fn(async (clusterId: number) => (clusterId === 7 ? 6 : 10)),
			getClusterChildren: vi.fn(async (clusterId: number) => {
				if (clusterId === 7) {
					return [
						{
							properties: { cluster: true, cluster_id: 8, point_count: 2 },
							geometry: { coordinates: [-97.2, 30.2] },
						},
					];
				}
				return [
					{
						properties: { id: "live", isActive: true, isActiveLastWeek: true },
						geometry: { coordinates: [-97.1, 30.4] },
					},
					{
						properties: { id: "quiet", isActive: false },
						geometry: { coordinates: [-97.2, 30.2] },
					},
				];
			}),
			getClusterLeaves: vi.fn(async (clusterId: number) => {
				if (clusterId === 8) {
					return [
						{
							properties: { id: "live", isActive: true, isActiveLastWeek: true },
							geometry: { coordinates: [-97.1, 30.4] },
						},
					];
				}
				return [
					{
						properties: { id: "far", isActive: true, isActiveLastWeek: true },
						geometry: { coordinates: [-80, 25] },
					},
					{
						properties: { id: "live", isActive: true, isActiveLastWeek: true },
						geometry: { coordinates: [-97.1, 30.4] },
					},
					{
						properties: { id: "quiet", isActive: false },
						geometry: { coordinates: [-97.2, 30.2] },
					},
				];
			}),
		};
		await expect(activeClusterRevealTarget(source, 7, [-97.7, 30.3], 3)).resolves.toEqual({
			zoom: 10,
			center: [-97.1, 30.4],
		});
		await expect(
			activeClusterRevealTarget(
				{
					...source,
					getClusterLeaves: vi.fn(async () => []),
				},
				7,
				[-97.7, 30.3],
				3,
			),
		).resolves.toEqual({ zoom: 6, center: [-97.7, 30.3] });
	});

	it("ignores leaves that cannot be drawn and stops when the active facility never separates", async () => {
		const leaves = [
			{ properties: { isActive: true, isActiveLastWeek: true }, geometry: { coordinates: [1, 2] } },
			{
				properties: { id: "dead", isActive: null, isActiveLastWeek: null },
				geometry: { coordinates: [0, 0] },
			},
			{ properties: { id: "zero", isActive: 0 }, geometry: { coordinates: [0, 0] } },
			{ properties: { id: "text", isActive: "false" }, geometry: { coordinates: [0, 0] } },
			{ properties: { id: "missing", isActive: true, isActiveLastWeek: true } },
			{
				properties: { id: "short", isActive: true, isActiveLastWeek: true },
				geometry: { coordinates: [1] },
			},
			{
				properties: { id: "words", isActive: true, isActiveLastWeek: true },
				geometry: { coordinates: ["x", "y"] },
			},
			{
				properties: { id: 9, isActive: "1" },
				geometry: { coordinates: [-97.2, 30.2] },
			},
			{
				properties: { id: "near", isActive: true, isActiveLastWeek: true },
				geometry: { coordinates: [-97.5, 30.3] },
			},
		];
		const source = {
			getClusterExpansionZoom: vi.fn(async (clusterId: number) => clusterId),
			getClusterChildren: vi.fn(async (clusterId: number) => {
				if (clusterId === 1) {
					return [
						{ properties: { id: "other" }, geometry: { coordinates: [1, 2] } },
						{ properties: { cluster: true, cluster_id: "bad" } },
						{ properties: { cluster: true, cluster_id: 2 } },
					];
				}
				return [{ properties: { cluster: true, cluster_id: 4, point_count: 1 } }];
			}),
			getClusterLeaves: vi.fn(async (clusterId: number) => {
				if (clusterId === 2) {
					return [
						{
							properties: { id: "other", isActive: true, isActiveLastWeek: true },
							geometry: { coordinates: [1, 2] },
						},
					];
				}
				return leaves;
			}),
		};
		const tree = source as ClusterTreeSource;
		await expect(activeClusterRevealTarget(tree, 1, [-97.7, 30.3], 0)).resolves.toEqual({
			zoom: 1,
			center: [-97.5, 30.3],
		});
		expect(source.getClusterLeaves).toHaveBeenCalledWith(1, 1, 0);
		expect(source.getClusterLeaves).toHaveBeenCalledWith(2, 1, 0);
		await expect(activeClusterRevealTarget(tree, 4, [-97.7, 30.3], 3)).resolves.toEqual({
			zoom: 4,
			center: [-97.5, 30.3],
		});
	});
});

describe("facility layer motion", () => {
	it("fades a facility layer host in from below and out downward", () => {
		const host = document.createElement("div");
		applyFacilityLayerMotion(host, "enter");
		expect(host.classList.contains("facility-layer-in")).toBe(true);
		expect(host.style.opacity).toBe("");
		applyFacilityLayerMotion(host, "exit");
		expect(host.classList.contains("facility-layer-out")).toBe(true);
		expect(host.classList.contains("facility-layer-in")).toBe(false);
	});
});

describe("facility glass", () => {
	it("draws a 29px glass disc with a 17px logo, and a white mark when the facility is inactive", () => {
		const active = createFacilityGlassNode();
		const logo = active.querySelector("img");
		expect(active.style.width).toBe("29px");
		expect(logo?.getAttribute("src")).toBe("/images/plei-logo.svg");
		expect(logo).toHaveStyle({ width: "17px", height: "17px" });
		applyFacilityGlassActivity(active, true);
		expect(logo?.getAttribute("src")).toBe("/images/plei-logo.svg");
		applyFacilityGlassActivity(active, false);
		expect(active.style.backgroundColor).toBe("rgba(255, 255, 255, 0.336)");
		expect(active.style.backdropFilter).toBe("blur(18px) saturate(1.8)");
		expect(logo).toBeInstanceOf(HTMLImageElement);
		expect((logo as HTMLImageElement).style.filter).toBe("none");
		expect(logo?.getAttribute("src")).toBe("/images/plei-logo-white.svg");
		const badges = readFacilityGlassBadges(
			[
				{
					geometry: { coordinates: [1, 2] },
					properties: { id: "quiet", isActive: false },
				},
			],
			() => ({ x: 4, y: 5 }),
		);
		expect(badges).toEqual([{ id: "quiet", x: 4, y: 5, active: false }]);
	});

	it("draws a 41px glass cluster and a gray stroke and count when no facility inside is active", () => {
		const node = createClusterGlassNode();
		const ring = node.querySelector("[data-testid='cluster-glass-stroke']");
		const label = node.querySelector("[data-testid='cluster-glass-label']");
		expect(node.style.width).toBe("41px");
		expect(node.style.pointerEvents).toBe("none");
		expect(ring).toHaveStyle({ width: "35px", height: "35px", border: "2px solid #86EFAC" });
		applyClusterGlassActivity(node, false);
		expect(node.style.backgroundColor).toBe("rgba(255, 255, 255, 0.28)");
		expect(node.style.backdropFilter).toBe("blur(18px) saturate(1.8)");
		expect(node.style.color).toBe("rgb(55, 65, 81)");
		expect(label).toBeInstanceOf(HTMLElement);
		expect((label as HTMLElement).style.color).toBe("rgb(55, 65, 81)");
		expect(ring).toBeInstanceOf(HTMLElement);
		expect((ring as HTMLElement).style.borderColor).toBe("rgb(137, 142, 153)");
	});

	it("scales a hovered cluster marker and eases the transform back", () => {
		const css = readFileSync(resolve(process.cwd(), "src/app/globals.css"), "utf8");
		const markerStart = css.indexOf(".cluster-marker {");
		const marker = css.slice(markerStart, markerStart + 120);
		const reduced = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"));
		expect(marker).toContain(
			`transition: transform ${CLUSTER_MARKER_MOTION_MS}ms ${CLUSTER_MARKER_MOTION_EASING};`,
		);
		expect(reduced).toContain(".cluster-marker {");
		expect(reduced).toContain("transition-duration: 1ms;");
		const host = document.createElement("div");
		const nodes = new Map<number, HTMLElement>();
		const badges = [
			{ id: 62, label: "62", x: 40, y: 420, active: true },
			{ id: 8, label: "8", x: 200, y: 300, active: true },
		];
		syncClusterGlass(host, badges, nodes, 62);
		const hovered = nodes.get(62);
		const resting = nodes.get(8);
		expect(hovered?.classList.contains(CLUSTER_MARKER_CLASS)).toBe(true);
		expect(resting?.classList.contains(CLUSTER_MARKER_CLASS)).toBe(true);
		expect(createFacilityGlassNode().classList.contains(CLUSTER_MARKER_CLASS)).toBe(false);
		expect(hovered?.style.transform).toBe(
			`translate(40px, 420px) translate(-50%, -50%) scale(${CLUSTER_MARKER_HOVER_SCALE})`,
		);
		expect(resting?.style.transform).toBe("translate(200px, 300px) translate(-50%, -50%) scale(1)");
		syncClusterGlass(host, badges, nodes, null);
		expect(hovered?.style.transform).toBe("translate(40px, 420px) translate(-50%, -50%) scale(1)");
	});

	it("keeps one badge per cluster and marks a cluster inactive when it has no active facility", () => {
		const project = () => ({ x: 1, y: 2 });
		expect(
			readClusterGlassBadges(
				[
					{
						properties: { cluster_id: 1, point_count_abbreviated: "1.2k" },
						geometry: { coordinates: [0, 0] },
					},
					{
						properties: { cluster_id: 1, point_count: 3 },
						geometry: { coordinates: [0, 0] },
					},
					{ properties: { cluster_id: 2 }, geometry: { coordinates: [0, 0] } },
					{
						properties: { cluster_id: 4, point_count_abbreviated: 9 },
						geometry: { coordinates: [0, 0] },
					},
					{
						properties: { cluster_id: 8, point_count: 4, activeCount: 2 },
						geometry: { coordinates: [0, 0] },
					},
					{
						properties: { cluster_id: 9, point_count: 4, activeCount: 0 },
						geometry: { coordinates: [0, 0] },
					},
					{
						properties: { cluster_id: 5, point_count: 1 },
						geometry: { coordinates: ["x", "y"] },
					},
					{ properties: { point_count: 4 }, geometry: { coordinates: [0, 0] } },
					{ properties: { cluster_id: 3, point_count: 1 } },
				],
				project,
			),
		).toEqual([
			{ id: 1, label: "1.2k", x: 1, y: 2, active: false },
			{ id: 2, label: "", x: 1, y: 2, active: false },
			{ id: 4, label: "9", x: 1, y: 2, active: false },
			{ id: 8, label: "4", x: 1, y: 2, active: true },
			{ id: 9, label: "4", x: 1, y: 2, active: false },
		]);
		expect(
			readFacilityGlassBadges(
				[
					{
						properties: { cluster_id: 1, id: "c" },
						geometry: { coordinates: [0, 0] },
					},
					{ properties: { id: "a" }, geometry: { coordinates: [0, 0] } },
					{
						properties: { id: "a", isActive: false },
						geometry: { coordinates: [0, 0] },
					},
					{ properties: { id: 4 }, geometry: { coordinates: [0, 0] } },
					{
						properties: { id: "b", isActive: "false" },
						geometry: { coordinates: [0, 0] },
					},
					{ properties: { id: "d", isActive: 0 }, geometry: { coordinates: [9, 9] } },
					{
						properties: { id: "e", isActive: "0" },
						geometry: { coordinates: [9, 9] },
					},
				],
				project,
			).map((badge) => [badge.id, badge.active]),
		).toEqual([
			["a", true],
			["b", false],
			["d", false],
			["e", false],
		]);
	});

	it("projects glass discs on each map render and removes them when facilities are hidden", () => {
		const container = document.createElement("div");
		const frames = new Map<number, FrameRequestCallback>();
		let nextFrame = 1;
		const requestFrame = vi
			.spyOn(window, "requestAnimationFrame")
			.mockImplementation((callback) => {
				const id = nextFrame;
				nextFrame += 1;
				frames.set(id, callback);
				return id;
			});
		const cancelFrame = vi.spyOn(window, "cancelAnimationFrame").mockImplementation((id) => {
			frames.delete(id);
		});
		const handlers = new Map<string, () => void>();
		const layers = new Set(["facilities-clusters", "facilities-dots"]);
		const map = {
			getContainer: () => container,
			getLayer: (id: string) => (layers.has(id) ? {} : undefined),
			queryRenderedFeatures: ({ layers: requested }: { layers: string[] }) => {
				if (requested[0] === "facilities-clusters") {
					return [
						{
							geometry: { coordinates: [1, 2] },
							properties: { cluster_id: 7, point_count: 12, activeCount: 12 },
						},
					];
				}
				return [
					{
						geometry: { coordinates: [3, 4] },
						properties: { id: "f1", isActive: true, isActiveLastWeek: true },
					},
					{
						geometry: { coordinates: [5, 6] },
						properties: { id: "quiet", isActive: false },
					},
				];
			},
			project: () => ({ x: 10, y: 20 }),
			on: (_event: string, handler: () => void) => {
				handlers.set("render", handler);
			},
			off: vi.fn(),
		};
		const showFacilitiesRef = { current: true };
		const selectedFacilityIdRef = { current: "f1" as string | null };
		const unbind = bindFacilityGlass(map as never, showFacilitiesRef, selectedFacilityIdRef);
		const flush = () => {
			const id = [...frames.keys()][0];
			const callback = id === undefined ? undefined : frames.get(id);
			if (id !== undefined) frames.delete(id);
			callback?.(0);
		};
		expect(container.querySelector("[data-testid='cluster-glass']")).toHaveStyle({
			pointerEvents: "none",
		});
		handlers.get("render")?.();
		expect(frames.size).toBe(1);
		flush();
		expect(container.querySelector("[data-testid='cluster-glass-label']")?.textContent).toBe("12");
		expect(container.querySelector("[data-testid='cluster-glass'] > div")).toHaveStyle({
			pointerEvents: "none",
		});
		const discs = container.querySelectorAll("[data-testid='facility-glass'] > div");
		const selected = discs[0];
		const inactive = discs[1];
		expect(selected).toBeInstanceOf(HTMLElement);
		expect(inactive).toBeInstanceOf(HTMLElement);
		expect(selected).toHaveStyle({
			boxShadow:
				"inset 0 1px 0 rgba(255,255,255,0.9), inset 0 0 0 3px #111827, 0 10px 24px rgba(0,0,0,0.12)",
			pointerEvents: "none",
		});
		expect((inactive as HTMLElement).style.boxShadow).toBe(
			"inset 0 1px 0 rgba(255,255,255,0.9), inset 0 0 0 2px #6B7280, 0 10px 24px rgba(0,0,0,0.12)",
		);
		layers.clear();
		handlers.get("render")?.();
		flush();
		expect(container.querySelector("[data-testid='cluster-glass-label']")).toBeNull();
		showFacilitiesRef.current = false;
		handlers.get("render")?.();
		flush();
		handlers.get("render")?.();
		unbind?.();
		expect(cancelFrame).toHaveBeenCalled();
		expect(container.childElementCount).toBe(0);
		requestFrame.mockRestore();
		cancelFrame.mockRestore();
		expect(
			bindFacilityGlass(
				{ getContainer: () => ({}) } as never,
				showFacilitiesRef,
				selectedFacilityIdRef,
			),
		).toBeUndefined();
	});
});

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
						marketName: "Austin",
						name: "Eastside Futsal Arena",
						isActive: true,
					},
				},
			],
		});
	});
});

describe("toFacilityFeatureCollection stacking", () => {
	it("puts inactive facilities first and active last so the active one renders and is picked on top", () => {
		const location = { latitude: 39.96, longitude: -75.15 };
		const facilities = [
			{ ...FACILITY, id: "a1", isActive: true, isActiveLastWeek: true, location },
			{ ...FACILITY, id: "i1", isActive: false, isActiveLastWeek: false, location },
			{ ...FACILITY, id: "a2", isActive: true, isActiveLastWeek: true, location },
			{ ...FACILITY, id: "i2", isActive: false, isActiveLastWeek: false, location },
		];

		const collection = toFacilityFeatureCollection(facilities);

		expect(collection.features.map((feature) => feature.properties.id)).toEqual([
			"i1",
			"i2",
			"a1",
			"a2",
		]);
		expect(facilities.map((facility) => facility.id)).toEqual(["a1", "i1", "a2", "i2"]);
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

describe("marketBounds", () => {
	it("contains every facility or returns null for an empty market", () => {
		expect(
			marketBounds([
				FACILITY,
				{ ...FACILITY, id: "f2", location: { latitude: 31, longitude: -96 } },
			]),
		).toEqual([
			[-97.74, 30.27],
			[-96, 31],
		]);
		expect(marketBounds([])).toBeNull();
	});
});

describe("marketBounds", () => {
	it("returns the corners containing all market facilities", () => {
		expect(
			marketBounds([
				FACILITY,
				{ ...FACILITY, id: "f2", location: { latitude: 31, longitude: -96 } },
			]),
		).toEqual([
			[-97.74, 30.27],
			[-96, 31],
		]);
		expect(marketBounds([])).toBeNull();
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
		layersState.showActiveFacilities = true;
		layersState.showInactiveFacilities = true;
		layersState.showSessions = true;
		layersState.hasProvider = true;
		layersState.sessionFilters = {};
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

	it("shows only active facilities when there is no layers provider", async () => {
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

	it("filters facilities before clustering for each supply selection", async () => {
		const inactive = { ...FACILITY, id: "inactive", isActive: false, isActiveLastWeek: false };
		mockUseFacilities.mockReturnValue({
			data: [FACILITY, inactive],
			isPending: false,
			isError: false,
		});
		const { rerender } = renderRules();
		await waitFor(() => expect(mapState.instances).toHaveLength(1));
		act(() => mapState.handlers.get("load")?.());
		layersState.showInactiveFacilities = false;
		rerender();
		expect(mapState.setData).toHaveBeenLastCalledWith(toFacilityFeatureCollection([FACILITY]));
		layersState.showActiveFacilities = false;
		layersState.showInactiveFacilities = true;
		rerender();
		expect(mapState.setData).toHaveBeenLastCalledWith(toFacilityFeatureCollection([inactive]));
		layersState.showInactiveFacilities = false;
		rerender();
		expect(mapState.setData).toHaveBeenLastCalledWith(toFacilityFeatureCollection([]));
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
		expect(mapState.canvas.style.cursor).toBe("pointer");
		act(() => mapState.handlers.get(`mouseleave:${CLUSTER_LAYER_ID}`)?.());
		expect(mapState.canvas.style.cursor).toBe("");

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
	it.each([
		[
			{ gender: ["male", "female"], skill: ["Beginner", "Expert"], ageMin: 18, ageMax: 35 },
			"Male, Female · Beginner, Expert · 18–35",
		],
		[{ gender: "other", skill: "Advanced", ageMin: 21 }, "Other · Advanced · 21+"],
		[{ ageMax: 17 }, "≤ 17"],
		[{ ageMin: 25, ageMax: 25 }, "25"],
	] satisfies [AppSessionFilters, string][])(
		"names the applied demographic cohort %j",
		(filters, summary) => {
			layersState.sessionFilters = filters;
			const { result } = renderRules();
			expect(result.current.sessionFilterSummary).toBe(summary);
		},
	);
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
});

describe("facilitiesForPeriod", () => {
	it("marks facilities active by last week's games for the week and keeps 28 days otherwise", () => {
		const quietLastWeek = { ...FACILITY, isActive: true, isActiveLastWeek: false };

		expect(facilitiesForPeriod([quietLastWeek], "week")[0]?.isActive).toBe(false);
		expect(facilitiesForPeriod([quietLastWeek], "month")[0]?.isActive).toBe(true);
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
		expect(result.current.sessionHeatmapLegend).toBe("Sessions per shaded area · last week");
	});
});
