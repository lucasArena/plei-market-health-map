"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type {
	SidePanelContextValue,
	SidePanelId,
	SidePanelProviderProps,
} from "@/presentation/components/providers/SidePanelProvider/SidePanelProviderComponent.types";

const SidePanelContext = createContext<SidePanelContextValue>({
	activePanel: null,
	openPanel: () => undefined,
	releasePanel: () => undefined,
});

export function SidePanelProvider({ children }: Readonly<SidePanelProviderProps>) {
	const [activePanel, setActivePanel] = useState<SidePanelId | null>(null);
	const openPanel = useCallback((id: SidePanelId) => setActivePanel(id), []);
	const releasePanel = useCallback(
		(id: SidePanelId) => setActivePanel((current) => (current === id ? null : current)),
		[],
	);
	const value = useMemo(
		() => ({ activePanel, openPanel, releasePanel }),
		[activePanel, openPanel, releasePanel],
	);
	return <SidePanelContext.Provider value={value}>{children}</SidePanelContext.Provider>;
}

export function useSidePanels(): SidePanelContextValue {
	return useContext(SidePanelContext);
}
