import type { KeyboardEvent } from "react";

export interface AppSessionFiltersProps {
	showSessions: boolean;
}
export type SessionFilterField = "gender" | "skill" | "age";
export type SessionFilterMenu = SessionFilterField | "add" | null;
export interface SessionFilterChoice {
	value: string;
	label: string;
}
export type FilterKeyboardEvent = KeyboardEvent<HTMLElement>;
