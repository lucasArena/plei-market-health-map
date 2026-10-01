import type { RegistrationHeatmapCellView } from "@core/application/dtos/registration-heatmap-dto.types";

export interface RegistrationHeatmapRepository {
	listLast28Days(): Promise<RegistrationHeatmapCellView[]>;
}
