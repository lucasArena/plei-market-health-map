import type { ReactNode } from "react";

export interface PanelSectionProps {
	title: string;
	aside?: string;
	children: ReactNode;
	testId?: string;
}
