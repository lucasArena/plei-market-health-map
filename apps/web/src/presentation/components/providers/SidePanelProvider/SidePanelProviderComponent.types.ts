import type { ReactNode } from "react";

export type SidePanelId = "facility-detail" | "market-summary" | "metric-drill-down";

export interface SidePanelContextValue {
	activePanel: SidePanelId | null;
	openPanel(id: SidePanelId): void;
	releasePanel(id: SidePanelId): void;
	registerCloser(id: SidePanelId, close: () => void): () => void;
	closePanel(id: SidePanelId): void;
}

export interface SidePanelProviderProps {
	children: ReactNode;
}
