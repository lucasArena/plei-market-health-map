import type { RefObject } from "react";

export interface MetricDrillDownToggleView {
	label: string;
	triggerRef: RefObject<HTMLButtonElement | null>;
	isOpen: boolean;
	isVisible: boolean;
	isClosing: boolean;
	handleClosed(): void;
	close(): void;
	toggle(): void;
}
