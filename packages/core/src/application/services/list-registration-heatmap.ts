import type { RegistrationHeatmapCellView } from "@core/application/dtos/registration-heatmap-dto.types";
import type { ListRegistrationHeatmapDeps } from "@core/application/services/list-registration-heatmap.types";

export function makeListRegistrationHeatmap({ registrationHeatmap }: ListRegistrationHeatmapDeps) {
	return async function listRegistrationHeatmap(): Promise<RegistrationHeatmapCellView[]> {
		return registrationHeatmap.listLast28Days();
	};
}
