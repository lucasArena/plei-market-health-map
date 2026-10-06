import type { ReactNode } from "react";

export interface GameDepartmentFilterProps {
	enabled: boolean;
}

export interface GameDepartmentFiltersProps extends GameDepartmentFilterProps {
	children?: ReactNode;
}

export interface DepartmentCheckMarkProps {
	selected: boolean;
}
