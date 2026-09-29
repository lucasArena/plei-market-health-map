import { EmptyAppSessionHeatmapRepository } from "@server/infrastructure/sample/empty-app-session-heatmap-repository";

describe("EmptyAppSessionHeatmapRepository", () => {
	it("returns no cells", async () => {
		await expect(new EmptyAppSessionHeatmapRepository().listLast28Days()).resolves.toEqual([]);
	});
});
