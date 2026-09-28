export const SERVICE_AREA = {
	minLatitude: -56,
	maxLatitude: 72,
	minLongitude: -170,
	maxLongitude: -34,
} as const;

export function isWithinServiceArea(latitude: number, longitude: number): boolean {
	return (
		latitude >= SERVICE_AREA.minLatitude &&
		latitude <= SERVICE_AREA.maxLatitude &&
		longitude >= SERVICE_AREA.minLongitude &&
		longitude <= SERVICE_AREA.maxLongitude
	);
}
