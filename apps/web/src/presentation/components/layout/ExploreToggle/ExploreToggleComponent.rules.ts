"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ExploreToggleView } from "@/presentation/components/layout/ExploreToggle/ExploreToggleComponent.types";
import { useMessages } from "@/presentation/components/providers/MessagesProvider/MessagesProviderComponent";
import { useExclusiveSidePanel } from "@/presentation/hooks/use-side-panel/use-exclusive-side-panel";

export function useExploreToggleRules(): ExploreToggleView {
	const triggerRef = useRef<HTMLButtonElement>(null);
	const pathname = usePathname();
	const isVisible = pathname === "/";
	const [state, setState] = useState<"closed" | "open" | "closing">("closed");
	const isOpen = state === "open";
	const close = useCallback(
		() => setState((current) => (current === "open" ? "closing" : current)),
		[],
	);
	const handleClosed = useCallback(() => setState("closed"), []);
	const toggle = useCallback(
		() => setState((current) => (current === "open" ? "closing" : "open")),
		[],
	);
	useExclusiveSidePanel("explore", isOpen && isVisible, close);
	useEffect(() => {
		if (!isVisible) setState("closed");
	}, [isVisible]);
	const { messages } = useMessages();
	return {
		triggerRef,
		isOpen: isOpen && isVisible,
		isVisible,
		isClosing: state === "closing",
		handleClosed,
		close,
		toggle,
		label: messages.drillDown.title,
	};
}
