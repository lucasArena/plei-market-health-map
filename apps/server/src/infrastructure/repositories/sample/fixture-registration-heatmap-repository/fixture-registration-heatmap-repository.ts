import type {
	RegistrationHeatmapCellView,
	RegistrationHeatmapRepository,
} from "@market-health-map/core/application";

const REGISTRATION_HEATMAP_FIXTURE: RegistrationHeatmapCellView[] = [
	{ lat: 29.76, lng: -95.37, registrationWeight: 72 },
	{ lat: 25.77, lng: -80.19, registrationWeight: 58 },
	{ lat: 32.78, lng: -96.8, registrationWeight: 51 },
	{ lat: 28.54, lng: -81.38, registrationWeight: 43 },
	{ lat: 34.05, lng: -118.24, registrationWeight: 37 },
	{ lat: 40.71, lng: -74.01, registrationWeight: 31 },
];

export class FixtureRegistrationHeatmapRepository implements RegistrationHeatmapRepository {
	async listLast28Days(): Promise<RegistrationHeatmapCellView[]> {
		return [...REGISTRATION_HEATMAP_FIXTURE];
	}
}
