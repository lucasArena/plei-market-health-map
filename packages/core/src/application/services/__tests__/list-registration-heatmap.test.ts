import type { RegistrationHeatmapRepository } from "@core/application/repositories/registration-heatmap-repository.types";
import { makeListRegistrationHeatmap } from "@core/application/services/list-registration-heatmap";

describe("listRegistrationHeatmap", () => {
	it("lists registration cells from the repository", async () => {
		const cells = [{ lat: 29.746, lng: -95.352, registrationWeight: 42 }];
		const registrationHeatmap: RegistrationHeatmapRepository = {
			listLast28Days: vi.fn().mockResolvedValue(cells),
		};

		const listRegistrationHeatmap = makeListRegistrationHeatmap({ registrationHeatmap });

		await expect(listRegistrationHeatmap()).resolves.toEqual(cells);
		expect(registrationHeatmap.listLast28Days).toHaveBeenCalledOnce();
	});
});
