import {
	activeClusterRevealTarget,
	placeHover,
} from "@/presentation/screens/FacilitiesMapScreen/FacilitiesMapScreenComponent.hover";
import type { ClusterTreeSource } from "@/presentation/screens/FacilitiesMapScreen/FacilitiesMapScreenComponent.types";

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
