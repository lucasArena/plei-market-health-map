"use client";

import { createContext, useContext } from "react";
import { useSidePanelProviderRules } from "@/presentation/components/providers/SidePanelProvider/SidePanelProviderComponent.rules";
import type {
	SidePanelContextValue,
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
	const value = useSidePanelProviderRules();
	return <SidePanelContext.Provider value={value}>{children}</SidePanelContext.Provider>;
}

export function useSidePanels(): SidePanelContextValue {
	return useContext(SidePanelContext);
}
