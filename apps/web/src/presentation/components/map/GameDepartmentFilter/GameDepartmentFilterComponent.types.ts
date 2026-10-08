import type { ReactNode } from "react";
import type { useGameDepartmentFiltersRules } from "@/presentation/components/map/GameDepartmentFilter/GameDepartmentFilterComponent.rules";

export interface GameDepartmentFilterProps {
	enabled: boolean;
}

export interface GameDepartmentFiltersProps extends GameDepartmentFilterProps {
	children?: ReactNode;
}

export interface DepartmentCheckMarkProps {
	selected: boolean;
}

export type GameDepartmentRules = ReturnType<typeof useGameDepartmentFiltersRules>;
