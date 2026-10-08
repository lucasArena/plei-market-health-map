import type {
	GameDepartment,
	GameDepartmentCounts,
} from "@core/domain/entities/facility/facility.types";

export const GAME_DEPARTMENTS = [
	"magic",
	"organizers",
	"partnerships",
] as const satisfies readonly GameDepartment[];

export function normalizeGameDepartments(
	departments: readonly GameDepartment[] | undefined,
): GameDepartment[] {
	const selected = GAME_DEPARTMENTS.filter((department) => departments?.includes(department));
	return selected.length === GAME_DEPARTMENTS.length ? [] : selected;
}

export function sumGameDepartments(
	counts: GameDepartmentCounts | undefined,
	departments: readonly GameDepartment[],
): number {
	return departments.reduce((sum, department) => sum + (counts?.[department] ?? 0), 0);
}
