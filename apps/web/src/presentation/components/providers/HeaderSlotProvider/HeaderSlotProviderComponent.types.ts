import type { ReactNode } from "react";

export interface HeaderSlotContextValue {
	searchSlot: HTMLElement | null;
	setSearchSlot(element: HTMLElement | null): void;
}

export interface HeaderSlotProviderProps {
	children: ReactNode;
}
