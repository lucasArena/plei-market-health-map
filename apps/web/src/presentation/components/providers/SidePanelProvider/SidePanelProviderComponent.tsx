"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import type {
	SidePanelContextValue,
	SidePanelId,
	SidePanelProviderProps,
} from "@/presentation/components/providers/SidePanelProvider/SidePanelProviderComponent.types";

const SidePanelContext = createContext<SidePanelContextValue>({
	activePanel: null,
	openPanel: () => undefined,
	releasePanel: () => undefined,
	registerCloser: () => () => undefined,
	closePanel: () => undefined,
});

export function SidePanelProvider({ children }: Readonly<SidePanelProviderProps>) {
	const [activePanel, setActivePanel] = useState<SidePanelId | null>(null);
	const openPanel = useCallback((id: SidePanelId) => setActivePanel(id), []);
	const releasePanel = useCallback(
		(id: SidePanelId) => setActivePanel((current) => (current === id ? null : current)),
		[],
	);
	const closersRef = useRef(new Map<SidePanelId, () => void>());
	const registerCloser = useCallback((id: SidePanelId, close: () => void) => {
		closersRef.current.set(id, close);
		return () => {
			if (closersRef.current.get(id) === close) closersRef.current.delete(id);
		};
	}, []);
	const closePanel = useCallback((id: SidePanelId) => closersRef.current.get(id)?.(), []);
	const value = useMemo(
		() => ({ activePanel, openPanel, releasePanel, registerCloser, closePanel }),
		[activePanel, openPanel, releasePanel, registerCloser, closePanel],
	);
	return <SidePanelContext.Provider value={value}>{children}</SidePanelContext.Provider>;
}

export function useSidePanels(): SidePanelContextValue {
	return useContext(SidePanelContext);
}
