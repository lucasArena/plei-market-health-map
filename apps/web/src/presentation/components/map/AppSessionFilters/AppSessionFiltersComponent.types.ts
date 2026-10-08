import type { KeyboardEvent, ReactNode, RefObject } from "react";
import type { useAppSessionFiltersRules } from "@/presentation/components/map/AppSessionFilters/AppSessionFiltersComponent.rules";

export interface AppSessionFiltersProps {
	showSessions: boolean;
	onApplied?: () => void;
	children?: ReactNode;
}

export type SessionFilterField = "gender" | "skill";
export type SessionFilterChipField = SessionFilterField | "age";

export interface FilterChoice {
	id: string;
	label: string;
	value: string;
}

export interface SelectedFilterChip {
	field: SessionFilterChipField;
	id: string;
	label: string;
}

export type AgeBound = "min" | "max";

export interface AgeText {
	min: string;
	max: string;
}

export interface FilterSection {
	id: SessionFilterField;
	label: string;
	open: boolean;
	toggle: () => void;
	buttonRef: RefObject<HTMLButtonElement | null>;
	groupRef: RefObject<HTMLFieldSetElement | null>;
	options: FilterChoice[];
}

export type FilterKeyboardEvent = KeyboardEvent<HTMLElement>;

export interface FilterChevronProps {
	open: boolean;
	pointsRight?: boolean;
}

export interface AgeFieldProps {
	label: string;
	value: string;
	increaseLabel: string;
	decreaseLabel: string;
	onChange: (value: string) => void;
	onStep: (direction: 1 | -1) => void;
}

export interface StepChevronProps {
	direction: "up" | "down";
}

export interface CheckMarkProps {
	selected: boolean;
}

export type SessionFilterRules = ReturnType<typeof useAppSessionFiltersRules>;
