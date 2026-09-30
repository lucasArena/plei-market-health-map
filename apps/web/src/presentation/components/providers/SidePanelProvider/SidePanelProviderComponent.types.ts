import type { ReactNode } from "react";

export type SidePanelId = "facility-detail" | "market-summary";

export interface SidePanelContextValue {
	activePanel: SidePanelId | null;
	openPanel(id: SidePanelId): void;
	releasePanel(id: SidePanelId): void;
}

export interface SidePanelProviderProps {
	children: ReactNode;
}
