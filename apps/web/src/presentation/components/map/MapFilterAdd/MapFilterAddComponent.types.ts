import type { RefObject } from "react";

export interface MapFilterAddButtonProps {
	label: string;
	open: boolean;
	onClick: () => void;
	buttonRef?: RefObject<HTMLButtonElement | null>;
}

export interface MapFilterChevronProps {
	open: boolean;
	pointsRight?: boolean;
}
