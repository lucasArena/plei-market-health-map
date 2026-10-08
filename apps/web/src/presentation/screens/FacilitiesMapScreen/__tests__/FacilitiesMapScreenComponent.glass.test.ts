import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { GAMES_TREND_COLORS } from "@/application/constants/games-trend-colors";
import {
	applyClusterGlassActivity,
	applyFacilityGlassActivity,
	applyFacilityLayerMotion,
	applyGlassTrend,
	applyInactiveGamesMarker,
	bindFacilityGlass,
	createClusterGlassNode,
	createFacilityGlassNode,
	nearestGlassPosition,
	readClusterGlassBadges,
	readFacilityGlassBadges,
	syncClusterGlass,
	syncFacilityGlass,
} from "@/presentation/screens/FacilitiesMapScreen/FacilitiesMapScreenComponent.glass";
import { clusterHoverPlacement } from "@/presentation/screens/FacilitiesMapScreen/FacilitiesMapScreenComponent.hover";
import {
	CLUSTER_GLASS_SHADOW,
	CLUSTER_MARKER_CLASS,
	CLUSTER_MARKER_HOVER_SCALE,
	CLUSTER_MARKER_MOTION_EASING,
	CLUSTER_MARKER_MOTION_MS,
	FACILITY_GLASS_SELECTED_SHADOW,
	INACTIVE_GAMES_MARKER_STYLE,
} from "@/presentation/screens/FacilitiesMapScreen/FacilitiesMapScreenComponent.styles";

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

	it("styles inactive games markers on the disc, ring, and label", () => {
		const node = document.createElement("div");
		const label = document.createElement("span");
		label.dataset.testid = "cluster-glass-label";
		node.appendChild(label);
		const ring = document.createElement("span");
		applyInactiveGamesMarker(node, true, ring);
		expect(node.dataset.inactive).toBe("true");
		expect(ring.style.borderStyle).not.toBe("solid");
		applyInactiveGamesMarker(node, false, ring);
		expect(node.dataset.inactive).toBeUndefined();
		expect(ring.style.borderStyle).toBe("solid");
		applyInactiveGamesMarker(node, true);
		expect(node.style.border).toContain("dashed");
		applyInactiveGamesMarker(node, false);
		expect(node.style.opacity).toBe("");
	});

	it("places cluster hovers at the cluster center", () => {
		expect(clusterHoverPlacement({ x: 12, y: 34 }, { width: 800, height: 600 })).toEqual({
			x: 12,
			y: 34,
			flipX: false,
			flipY: false,
			viewport: { width: 800, height: 600 },
		});
	});

	it("draws a 41px glass cluster and a gray stroke and count when no facility inside is active", () => {
		const node = createClusterGlassNode();
		const ring = node.querySelector("[data-testid='cluster-glass-stroke']");
		const label = node.querySelector("[data-testid='cluster-glass-label']");
		const css = readFileSync(resolve(process.cwd(), "src/app/globals.css"), "utf8");
		expect(node.style.width).toBe("41px");
		expect(node.style.pointerEvents).toBe("none");
		expect(css).toContain(
			'.games-count-circle [data-testid="cluster-glass-stroke"],\n.games-count-circle [data-testid="facility-glass-stroke"]',
		);
		expect(css).toContain(
			'var(--games-circle-ring-image, url("/icons/games-trend-ring.svg")) center / 35px 35px no-repeat',
		);
		expect(ring).toHaveStyle({ inset: "3px", border: "2px solid #86EFAC" });
		applyClusterGlassActivity(node, false);
		expect(node.style.backgroundColor).toBe("rgba(255, 255, 255, 0.28)");
		expect(node.style.backdropFilter).toBe("blur(18px) saturate(1.8)");
		expect(node.style.color).toBe("rgb(55, 65, 81)");
		expect(label).toBeInstanceOf(HTMLElement);
		expect((label as HTMLElement).style.color).toBe("rgb(55, 65, 81)");
		expect(ring).toBeInstanceOf(HTMLElement);
		expect((ring as HTMLElement).style.borderColor).toBe("rgb(137, 142, 153)");
	});

	it("updates cluster positions immediately while easing hover scale", () => {
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
		expect(createFacilityGlassNode().classList.contains(CLUSTER_MARKER_CLASS)).toBe(true);
		expect(hovered?.style.transform).toBe(
			`translate(-50%, -50%) scale(${CLUSTER_MARKER_HOVER_SCALE})`,
		);
		expect(resting?.style.transform).toBe("translate(-50%, -50%) scale(1)");
		expect(hovered?.style.left).toBe("40px");
		expect(hovered?.style.top).toBe("420px");
		syncClusterGlass(
			host,
			badges.map((badge) => ({ ...badge, x: 120, y: 240 })),
			nodes,
			62,
		);
		expect(nodes.get(62)).toBe(hovered);
		expect(hovered?.style.left).toBe("120px");
		expect(hovered?.style.top).toBe("240px");
		expect(hovered?.style.transform).toBe(
			`translate(-50%, -50%) scale(${CLUSTER_MARKER_HOVER_SCALE})`,
		);
		syncClusterGlass(host, badges, nodes, null);
		expect(hovered?.style.transform).toBe("translate(-50%, -50%) scale(1)");
	});

	it("scales unclustered facility count badges on hover", () => {
		const host = document.createElement("div");
		const nodes = new Map<string, HTMLElement>();
		const badges = [
			{ id: "a", label: "40", x: 40, y: 420, active: true },
			{ id: "b", label: "8", x: 200, y: 300, active: true },
		];
		syncFacilityGlass(host, badges, nodes, null, "a");
		const hovered = nodes.get("a");
		const resting = nodes.get("b");
		expect(hovered?.classList.contains(CLUSTER_MARKER_CLASS)).toBe(true);
		expect(resting?.classList.contains(CLUSTER_MARKER_CLASS)).toBe(true);
		expect(hovered?.style.transform).toBe(
			`translate(-50%, -50%) scale(${CLUSTER_MARKER_HOVER_SCALE})`,
		);
		expect(resting?.style.transform).toBe("translate(-50%, -50%) scale(1)");
		syncFacilityGlass(host, badges, nodes, null, null);
		expect(hovered?.style.transform).toBe("translate(-50%, -50%) scale(1)");
	});

	it("anchors glass markers when no projected positions exist", () => {
		expect(nearestGlassPosition([], { x: 5, y: 5 })).toEqual({ x: 5, y: 5 });
	});

	it("keeps the facility copy nearest the map center when the same id repeats", () => {
		const project = (coordinates: [number, number]) => ({
			x: coordinates[0] === 1 ? 40 : 900,
			y: 50,
		});
		expect(
			readFacilityGlassBadges(
				[
					{ properties: { id: "a" }, geometry: { coordinates: [1, 2] } },
					{ properties: { id: "a" }, geometry: { coordinates: [2, 2] } },
				],
				project,
				false,
				false,
				{ x: 45, y: 50 },
			),
		).toEqual([{ id: "a", x: 40, y: 50, active: true }]);
	});

	it("flags clusters with no games when games mode and trend are on", () => {
		const badges = readClusterGlassBadges(
			[
				{
					properties: {
						cluster_id: 1,
						point_count: 2,
						gameCount: 0,
						gamePreviousCount: 4,
					},
					geometry: { coordinates: [0, 0] },
				},
			],
			() => ({ x: 1, y: 2 }),
			true,
			false,
		);
		expect(badges[0]?.noGames).toBe(true);
	});

	it("keeps the cluster copy nearest the map center when tiles repeat the same id", () => {
		const project = (coordinates: [number, number]) => ({
			x: coordinates[0] === 1 ? 40 : 900,
			y: coordinates[1] === 2 ? 50 : 50,
		});
		const badges = readClusterGlassBadges(
			[
				{
					properties: { cluster_id: 3, point_count: 4, activeCount: 4 },
					geometry: { coordinates: [1, 2] },
				},
				{
					properties: { cluster_id: 3, point_count: 4, activeCount: 4 },
					geometry: { coordinates: [2, 2] },
				},
			],
			project,
			false,
			false,
			{ x: 45, y: 50 },
		);
		expect(badges).toEqual([{ id: 3, label: "4", x: 40, y: 50, active: true }]);
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
		const requestFrame = vi.spyOn(window, "requestAnimationFrame");
		let projectedPoint = { x: 10, y: 20 };
		const handlers = new Map<string, () => void>();
		const layers = new Set(["facilities-clusters", "facilities-dots"]);
		const map = {
			getCanvasContainer: () => container,
			getContainer: () => container,
			getCenter: () => ({ lng: 0, lat: 0 }),
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
			project: () => projectedPoint,
			on: (_event: string, handler: () => void) => {
				handlers.set("render", handler);
			},
			off: vi.fn(),
		};
		const showFacilitiesRef = { current: true };
		const selectedFacilityIdRef = { current: "f1" as string | null };
		const unbind = bindFacilityGlass(map as never, showFacilitiesRef, selectedFacilityIdRef);
		expect(container.querySelector("[data-testid='cluster-glass']")).toHaveStyle({
			pointerEvents: "none",
		});
		handlers.get("render")?.();
		expect(requestFrame).not.toHaveBeenCalled();
		const cluster = container.querySelector("[data-testid='cluster-glass'] > div");
		expect((cluster as HTMLElement).style.left).toBe("10px");
		expect((cluster as HTMLElement).style.top).toBe("20px");
		projectedPoint = { x: 80, y: 90 };
		handlers.get("render")?.();
		expect((cluster as HTMLElement).style.left).toBe("80px");
		expect((cluster as HTMLElement).style.top).toBe("90px");
		expect(requestFrame).not.toHaveBeenCalled();
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
		expect(container.querySelector("[data-testid='cluster-glass-label']")).toBeNull();
		showFacilitiesRef.current = false;
		handlers.get("render")?.();
		handlers.get("render")?.();
		unbind?.();
		expect(map.off).toHaveBeenCalledWith("render", handlers.get("render"));
		expect(container.childElementCount).toBe(0);
		requestFrame.mockRestore();
		expect(
			bindFacilityGlass(
				{ getCanvasContainer: () => ({}), getContainer: () => ({}) } as never,
				showFacilitiesRef,
				selectedFacilityIdRef,
			),
		).toBeUndefined();
	});

	it("falls back to the map container when the canvas parent is not an element", () => {
		const container = document.createElement("div");
		const showFacilitiesRef = { current: true };
		const selectedFacilityIdRef = { current: null as string | null };
		const map = {
			getCanvasContainer: () => ({}),
			getContainer: () => container,
			getLayer: () => undefined,
			getCenter: () => ({ lng: 0, lat: 0 }),
			queryRenderedFeatures: () => [],
			project: () => ({ x: 0, y: 0 }),
			on: vi.fn(),
			off: vi.fn(),
		};
		const unbind = bindFacilityGlass(map as never, showFacilitiesRef, selectedFacilityIdRef);
		expect(container.querySelector("[data-testid='facility-glass']")).toBeTruthy();
		unbind?.();
	});

	it("draws games totals and trend rings when games mode is on", () => {
		const container = document.createElement("div");
		const handlers = new Map<string, () => void>();
		const layers = new Set(["facilities-clusters", "facilities-dots"]);
		const map = {
			getCanvasContainer: () => container,
			getContainer: () => container,
			getLayer: (id: string) => (layers.has(id) ? { id } : undefined),
			getCenter: () => ({ lng: -97, lat: 30 }),
			queryRenderedFeatures: ({ layers: requested }: { layers: string[] }) => {
				if (requested[0] === "facilities-clusters") {
					return [
						{
							geometry: { coordinates: [1, 2] },
							properties: {
								cluster_id: 2,
								point_count: 3,
								activeCount: 3,
								gameCount: 120,
								gamePreviousCount: 100,
							},
						},
					];
				}
				return [
					{
						geometry: { coordinates: [3, 4] },
						properties: {
							id: "f1",
							isActive: true,
							gamesLast28Days: 40,
							gamesPrevious28Days: 50,
						},
					},
				];
			},
			project: () => ({ x: 12, y: 34 }),
			on: (_event: string, handler: () => void) => {
				handlers.set("render", handler);
			},
			off: vi.fn(),
		};
		const showFacilitiesRef = { current: true };
		const showGamesRef = { current: true };
		const showTrendRef = { current: true };
		const unbind = bindFacilityGlass(
			map as never,
			showFacilitiesRef,
			{ current: "f1" },
			{ current: null },
			{ current: () => undefined },
			showGamesRef,
			showTrendRef,
		);
		handlers.get("render")?.();
		expect(container.querySelector("[data-testid='cluster-glass-label']")?.textContent).toBe("120");
		expect(container.querySelector("[data-testid='facility-glass-label']")?.textContent).toBe("40");
		unbind?.();
	});
});

describe("games trend on the glass ring", () => {
	const project = () => ({ x: 100, y: 50 });
	const point = { type: "Point" as const, coordinates: [-97.7, 30.3] };

	function clusterFeature(gameCount: number, gamePreviousCount: number, clusterId = 1) {
		return {
			properties: {
				cluster_id: clusterId,
				point_count: 3,
				activeCount: 1,
				gameCount,
				gamePreviousCount,
			},
			geometry: point,
		};
	}

	function facilityFeature(id: string, gamesLast28Days: number, gamesPrevious28Days: number) {
		return {
			properties: { id, isActive: true, gamesLast28Days, gamesPrevious28Days },
			geometry: point,
		};
	}

	it("classifies clusters and facilities while trend is on, and not with trend off", () => {
		const clusters = [
			clusterFeature(110, 100, 1),
			clusterFeature(90, 100, 2),
			clusterFeature(109, 100, 3),
		];
		expect(
			readClusterGlassBadges(clusters as never, project, true, true).map((b) => b.trend),
		).toEqual(["up", "down", "up"]);
		expect(readClusterGlassBadges(clusters as never, project, true, false)[0]).not.toHaveProperty(
			"trend",
		);

		const facilities = [
			facilityFeature("a", 6, 0),
			facilityFeature("b", 5, 9),
			facilityFeature("c", 4, 4),
		];
		expect(
			readFacilityGlassBadges(facilities as never, project, true, true).map((b) => b.trend),
		).toEqual(["up", "down", "stable"]);
		expect(
			readFacilityGlassBadges(facilities as never, project, true, false)[0],
		).not.toHaveProperty("trend");
		expect(
			readClusterGlassBadges(
				[{ properties: { cluster_id: 4, gameCount: "x" }, geometry: point }] as never,
				project,
				true,
				true,
			)[0],
		).toMatchObject({ noGames: true });
	});

	it("shows facilities and clusters that dropped to zero as declining", () => {
		const dropped = [facilityFeature("gone", 0, 9), facilityFeature("live", 5, 9)];
		expect(readFacilityGlassBadges(dropped as never, project, true, true)).toEqual([
			expect.objectContaining({ id: "gone", label: "0", trend: "down" }),
			expect.objectContaining({ id: "live", trend: "down" }),
		]);
		expect(readFacilityGlassBadges(dropped as never, project, true, true)[0]).not.toHaveProperty(
			"noGames",
		);
		expect(readFacilityGlassBadges(dropped as never, project, false, false)[0]).not.toHaveProperty(
			"noGames",
		);
		const [empty, busy] = readClusterGlassBadges(
			[clusterFeature(0, 12, 1), clusterFeature(9, 12, 2)] as never,
			project,
			true,
			true,
		);
		expect(empty).toMatchObject({ id: 1, label: "0", trend: "down" });
		expect(empty).not.toHaveProperty("noGames");
		expect(busy).toMatchObject({ id: 2, trend: "down" });
		expect(busy).not.toHaveProperty("noGames");
		expect(
			readClusterGlassBadges([clusterFeature(0, 12, 3)] as never, project, false, false)[0],
		).not.toHaveProperty("noGames");
	});

	it("fades an inactive facility with a dashed ring and no ring shadow, and restores it", () => {
		const host = document.createElement("div");
		const nodes = new Map<string, HTMLElement>();
		const badge = { id: "f1", label: "0", x: 10, y: 20, active: false };

		syncFacilityGlass(host, [{ ...badge, noGames: true }], nodes);
		const node = nodes.get("f1");
		const label = node?.querySelector<HTMLElement>("[data-testid='facility-glass-label']");
		const ring = node?.querySelector<HTMLElement>("[data-testid='facility-glass-stroke']");
		expect(node?.dataset.inactive).toBe("true");
		expect(node?.dataset.trendTip).toBeUndefined();
		expect(node?.style.opacity).toBe(String(INACTIVE_GAMES_MARKER_STYLE.opacity));
		expect(node?.style.boxShadow).toBe(CLUSTER_GLASS_SHADOW);
		expect(ring?.style.display).not.toBe("none");
		expect(ring?.style.borderStyle).toBe("dashed");
		expect(ring?.style.borderWidth).toBe("1.5px");
		expect(ring?.style.borderColor).toBe("rgb(107, 114, 128)");
		expect(label?.style.color).toBe("rgb(75, 85, 99)");

		syncFacilityGlass(host, [{ ...badge, noGames: true }], nodes, "f1");
		expect(node?.style.boxShadow).toBe(CLUSTER_GLASS_SHADOW);
		expect(ring?.style.borderStyle).toBe("dashed");
		expect(ring?.style.borderWidth).toBe("1.5px");

		syncFacilityGlass(host, [{ ...badge, label: "8", active: true, trend: "stable" }], nodes);
		expect(node?.dataset.inactive).toBeUndefined();
		expect(node?.dataset.trendTip).toBe("stable");
		expect(node?.style.opacity).toBe("");
		expect(node?.style.border).toBe("1px solid rgba(255, 255, 255, 0.78)");
	});

	it("dashes an inactive cluster's ring and restores the solid ring", () => {
		const host = document.createElement("div");
		const nodes = new Map<number, HTMLElement>();
		const badge = { id: 1, label: "0", x: 10, y: 20, active: false };

		syncClusterGlass(host, [{ ...badge, noGames: true }], nodes);
		const node = nodes.get(1);
		const ring = node?.querySelector<HTMLElement>("[data-testid='cluster-glass-stroke']");
		expect(node?.dataset.inactive).toBe("true");
		expect(node?.dataset.trendTip).toBeUndefined();
		expect(node?.style.opacity).toBe("0.6");
		expect(ring?.style.borderStyle).toBe("dashed");
		expect(ring?.style.borderWidth).toBe("1.5px");
		expect(ring?.style.borderColor).toBe("rgb(107, 114, 128)");

		syncClusterGlass(host, [{ ...badge, label: "12", active: true, trend: "up" }], nodes);
		expect(node?.dataset.inactive).toBeUndefined();
		expect(node?.style.opacity).toBe("");
		expect(ring?.style.borderStyle).toBe("solid");
		expect(ring?.style.borderWidth).toBe("2px");
		expect(ring?.style.borderColor).toBe("rgb(134, 239, 172)");
	});

	it("colors the existing cluster ring, paints the glass ring, and adds a tip for up and down only", () => {
		const host = document.createElement("div");
		const nodes = new Map<number, HTMLElement>();
		const badge = { id: 1, label: "12", x: 10, y: 20, active: true };

		syncClusterGlass(host, [{ ...badge, trend: "up" }], nodes);
		const node = nodes.get(1);
		const ring = node?.querySelector<HTMLElement>("[data-testid='cluster-glass-stroke']");
		expect(node?.classList.contains("games-trend-tip")).toBe(true);
		expect(node?.dataset.trendTip).toBe("up");
		expect(node?.style.getPropertyValue("--games-trend-color")).toBe(GAMES_TREND_COLORS.up);
		expect(node?.style.getPropertyValue("--games-trend-tip-box")).toBe("58px");
		expect(node?.style.getPropertyValue("--games-trend-inner")).toBe("19.5px");
		for (const level of ["up", "down", "stable"]) {
			expect(node?.style.getPropertyValue(`--games-trend-shape-${level}`)).toMatch(
				/^path\(evenodd, /,
			);
		}
		expect(ring?.style.borderColor).toBe("rgb(134, 239, 172)");

		syncClusterGlass(host, [{ ...badge, trend: "down" }], nodes);
		expect(node?.dataset.trendTip).toBe("down");
		expect(ring?.style.borderColor).toBe("rgb(248, 113, 113)");

		syncClusterGlass(host, [{ ...badge, trend: "stable" }], nodes);
		expect(node?.dataset.trendTip).toBe("stable");
		expect(ring?.style.borderColor).toBe("rgb(107, 114, 128)");

		syncClusterGlass(host, [badge], nodes);
		expect(node?.dataset.trendTip).toBeUndefined();
		expect(node?.style.getPropertyValue("--games-trend-color")).toBe("");
		expect(ring?.style.borderColor).toBe("rgb(134, 239, 172)");
	});

	it("keeps the logo marker selected inset shadow when no games", () => {
		const host = document.createElement("div");
		const nodes = new Map<string, HTMLElement>();
		syncFacilityGlass(host, [{ id: "f1", x: 10, y: 20, active: true, noGames: true }], nodes, "f1");
		const node = nodes.get("f1");
		const ring = node?.querySelector<HTMLElement>("[data-testid='facility-glass-stroke']");
		expect(ring?.style.display).toBe("none");
		expect(node?.style.boxShadow).toBe(FACILITY_GLASS_SELECTED_SHADOW);
	});

	it("uses the cluster stroke for selected and inactive count badges", () => {
		const host = document.createElement("div");
		const nodes = new Map<string, HTMLElement>();
		const badge = { id: "f1", label: "8", x: 10, y: 20, active: true };

		syncFacilityGlass(host, [badge], nodes, "f1");
		const ring = nodes
			.get("f1")
			?.querySelector<HTMLElement>("[data-testid='facility-glass-stroke']");
		expect(ring?.style.display).not.toBe("none");
		expect(ring?.style.borderColor).toBe("rgb(17, 24, 39)");
		expect(ring?.style.borderWidth).toBe("3px");

		syncFacilityGlass(host, [{ ...badge, active: false }], nodes);
		expect(ring?.style.borderColor).toBe("rgb(137, 142, 153)");
		expect(ring?.style.borderWidth).toBe("2px");

		syncFacilityGlass(host, [{ id: "f1", x: 10, y: 20, active: true }], nodes);
		expect(ring?.style.display).toBe("none");
	});

	it("colors the facility count ring like clusters, keeps selection thicker, and restores it with trend off", () => {
		const host = document.createElement("div");
		const nodes = new Map<string, HTMLElement>();
		const badge = { id: "f1", label: "8", x: 10, y: 20, active: true };

		syncFacilityGlass(host, [{ ...badge, trend: "down" }], nodes);
		const node = nodes.get("f1");
		const ring = node?.querySelector<HTMLElement>("[data-testid='facility-glass-stroke']");
		expect(node?.style.boxShadow).toBe(CLUSTER_GLASS_SHADOW);
		expect(ring?.style.borderColor).toBe("rgb(248, 113, 113)");
		expect(ring?.style.borderWidth).toBe("2px");
		expect(node?.dataset.trendTip).toBe("down");

		syncFacilityGlass(host, [{ ...badge, trend: "up" }], nodes, "f1");
		expect(ring?.style.borderColor).toBe("rgb(134, 239, 172)");
		expect(ring?.style.borderWidth).toBe("3px");

		syncFacilityGlass(host, [badge], nodes);
		expect(node?.style.boxShadow).toBe(CLUSTER_GLASS_SHADOW);
		expect(ring?.style.borderColor).toBe("rgb(134, 239, 172)");
		expect(ring?.style.borderWidth).toBe("2px");
		expect(node?.dataset.trendTip).toBeUndefined();
	});

	it("clears the glass ring, tip and color for no trend", () => {
		const node = document.createElement("div");
		applyGlassTrend(node, "up");
		applyGlassTrend(node, undefined);
		expect(node.dataset.trendTip).toBeUndefined();
		expect(node.style.getPropertyValue("--games-trend-color")).toBe("");
	});
});
