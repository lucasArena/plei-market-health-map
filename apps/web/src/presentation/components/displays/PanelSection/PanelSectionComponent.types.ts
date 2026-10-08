import type { ReactNode } from "react";

export interface PanelSectionProps {
	title: string;
	children: ReactNode;
	testId?: string;
}
