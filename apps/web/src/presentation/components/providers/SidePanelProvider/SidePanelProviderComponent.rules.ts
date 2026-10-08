"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type {
	SidePanelContextValue,
	SidePanelId,
} from "@/presentation/components/providers/SidePanelProvider/SidePanelProviderComponent.types";

export function useSidePanelProviderRules(): SidePanelContextValue {
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
	return useMemo(
		() => ({ activePanel, openPanel, releasePanel, registerCloser, closePanel }),
		[activePanel, openPanel, releasePanel, registerCloser, closePanel],
	);
}
