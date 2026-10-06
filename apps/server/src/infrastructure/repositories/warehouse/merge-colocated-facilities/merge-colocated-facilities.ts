import { Facility, type GameDepartmentCounts, type GeoPoint } from "@market-health-map/core/domain";

export const COLOCATED_RADIUS_METERS = 50;
const EARTH_RADIUS_METERS = 6_371_000;
const NAME_DIVIDER = /\s*\|\s*/;

export function baseFacilityName(name: string): string {
	return name.split(NAME_DIVIDER)[0]?.trim() || name.trim();
}

function nameKey(facility: Facility): string {
	return baseFacilityName(facility.toJSON().name).toLowerCase().replace(/\s+/g, " ");
}

function toRadians(degrees: number): number {
	return (degrees * Math.PI) / 180;
}

export function distanceInMeters(a: GeoPoint, b: GeoPoint): number {
	const haversine =
		Math.sin(toRadians(b.latitude - a.latitude) / 2) ** 2 +
		Math.cos(toRadians(a.latitude)) *
			Math.cos(toRadians(b.latitude)) *
			Math.sin(toRadians(b.longitude - a.longitude) / 2) ** 2;
	return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(haversine));
}

function isColocated(a: Facility, b: Facility): boolean {
	return distanceInMeters(a.toJSON().location, b.toJSON().location) <= COLOCATED_RADIUS_METERS;
}

function byId(a: Facility, b: Facility): number {
	return Number(a.id) - Number(b.id);
}

function hasSuffix(facility: Facility): number {
	return Number(NAME_DIVIDER.test(facility.toJSON().name));
}

function groupByName(facilities: Facility[]): Facility[][] {
	const groups = new Map<string, Facility[]>();
	for (const facility of facilities) {
		groups.set(nameKey(facility), [...(groups.get(nameKey(facility)) ?? []), facility]);
	}
	return [...groups.values()];
}

function clusterColocated(facilities: Facility[]): Facility[][] {
	return facilities.reduce<Facility[][]>((clusters, facility) => {
		const touching = clusters.filter((cluster) =>
			cluster.some((member) => isColocated(member, facility)),
		);
		const apart = clusters.filter((cluster) => !touching.includes(cluster));
		return [...apart, [...touching.flat(), facility]];
	}, []);
}

function departmentTotals(counts: (GameDepartmentCounts | undefined)[]): GameDepartmentCounts {
	return counts.reduce<GameDepartmentCounts>(
		(sum, current) => ({
			magic: sum.magic + (current?.magic ?? 0),
			organizers: sum.organizers + (current?.organizers ?? 0),
			partnerships: sum.partnerships + (current?.partnerships ?? 0),
		}),
		{ magic: 0, organizers: 0, partnerships: 0 },
	);
}

function mergeCluster(cluster: Facility[]): Facility {
	const members = [...cluster].sort((a, b) => hasSuffix(a) - hasSuffix(b) || byId(a, b));
	const representative = members[0] as Facility;
	if (members.length === 1) return representative;
	const props = representative.toJSON();
	const total = (pick: (facility: Facility) => number) =>
		members.reduce((sum, facility) => sum + pick(facility), 0);
	return Facility.create({
		...props,
		name: baseFacilityName(props.name),
		avatarUrl:
			members.map((facility) => facility.toJSON().avatarUrl).find((avatarUrl) => avatarUrl) ?? null,
		memberIds: members
			.flatMap((facility) => facility.memberIds)
			.sort((a, b) => Number(a) - Number(b)),
		metrics: {
			activePlayers: total((facility) => facility.toJSON().metrics.activePlayers),
			gamesLastWeek: total((facility) => facility.toJSON().metrics.gamesLastWeek),
			gamesLast28Days: total((facility) => facility.toJSON().metrics.gamesLast28Days),
			utilization: props.metrics.utilization,
			...(members.some((facility) => facility.toJSON().metrics.gamesPrevious28Days !== undefined)
				? {
						gamesPrevious28Days: total(
							(facility) => facility.toJSON().metrics.gamesPrevious28Days ?? 0,
						),
					}
				: {}),
			...(members.some((facility) => facility.toJSON().metrics.gamesPreviousByDepartment)
				? {
						gamesPreviousByDepartment: departmentTotals(
							members.map((facility) => facility.toJSON().metrics.gamesPreviousByDepartment),
						),
					}
				: {}),
			...(members.some((facility) => facility.toJSON().metrics.gamesLastWeekByDepartment)
				? {
						gamesLastWeekByDepartment: departmentTotals(
							members.map((facility) => facility.toJSON().metrics.gamesLastWeekByDepartment),
						),
					}
				: {}),
			...(members.some((facility) => facility.toJSON().metrics.gamesPreviousWeek !== undefined)
				? {
						gamesPreviousWeek: total(
							(facility) => facility.toJSON().metrics.gamesPreviousWeek ?? 0,
						),
					}
				: {}),
			...(members.some((facility) => facility.toJSON().metrics.gamesPreviousWeekByDepartment)
				? {
						gamesPreviousWeekByDepartment: departmentTotals(
							members.map((facility) => facility.toJSON().metrics.gamesPreviousWeekByDepartment),
						),
					}
				: {}),
			...(members.some((facility) => facility.toJSON().metrics.gamesByDepartment)
				? {
						gamesByDepartment: {
							magic: total((facility) => facility.toJSON().metrics.gamesByDepartment?.magic ?? 0),
							organizers: total(
								(facility) => facility.toJSON().metrics.gamesByDepartment?.organizers ?? 0,
							),
							partnerships: total(
								(facility) => facility.toJSON().metrics.gamesByDepartment?.partnerships ?? 0,
							),
						},
					}
				: {}),
		},
	});
}

export function mergeColocatedFacilities(facilities: Facility[]): Facility[] {
	return groupByName(facilities).flatMap(clusterColocated).map(mergeCluster).sort(byId);
}
