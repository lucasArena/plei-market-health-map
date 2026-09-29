import { EmptyAppSessionHeatmapRepository } from "@infra/sample/empty-app-session-heatmap-repository";

describe("EmptyAppSessionHeatmapRepository", () => {
	it("returns no cells", async () => {
		await expect(new EmptyAppSessionHeatmapRepository().listLast28Days()).resolves.toEqual([]);
	});
});
