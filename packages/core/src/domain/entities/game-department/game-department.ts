import type {
	GameDepartment,
	GameDepartmentCounts,
} from "@core/domain/entities/facility/facility.types";

/** Every game department, in the order the map lists them. */
export const GAME_DEPARTMENTS = [
	"magic",
	"organizers",
	"partnerships",
] as const satisfies readonly GameDepartment[];

/**
 * One canonical form for a department filter: known departments only, no repeats, in
 * `GAME_DEPARTMENTS` order. Picking every department is the same as picking none, so both
 * come back empty, which means "all games".
 */
export function normalizeGameDepartments(
	departments: readonly GameDepartment[] | undefined,
): GameDepartment[] {
	const selected = GAME_DEPARTMENTS.filter((department) => departments?.includes(department));
	return selected.length === GAME_DEPARTMENTS.length ? [] : selected;
}

/** Games in the selected departments; a missing breakdown counts as zero, as on the map. */
export function sumGameDepartments(
	counts: GameDepartmentCounts | undefined,
	departments: readonly GameDepartment[],
): number {
	return departments.reduce((sum, department) => sum + (counts?.[department] ?? 0), 0);
}
