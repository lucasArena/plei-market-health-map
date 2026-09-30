"use client";

import { useEffect, useRef } from "react";
import { useSidePanels } from "@/presentation/components/providers/SidePanelProvider/SidePanelProviderComponent";
import type { SidePanelId } from "@/presentation/components/providers/SidePanelProvider/SidePanelProviderComponent.types";

export function useExclusiveSidePanel(id: SidePanelId, isOpen: boolean, close: () => void): void {
	const { activePanel, openPanel, releasePanel } = useSidePanels();
	const lastActivePanelRef = useRef(activePanel);

	useEffect(() => {
		if (isOpen) openPanel(id);
		else releasePanel(id);
	}, [id, isOpen, openPanel, releasePanel]);

	useEffect(() => {
		const hasChanged = lastActivePanelRef.current !== activePanel;
		lastActivePanelRef.current = activePanel;
		if (hasChanged && isOpen && activePanel !== null && activePanel !== id) close();
	}, [activePanel, close, id, isOpen]);
}
