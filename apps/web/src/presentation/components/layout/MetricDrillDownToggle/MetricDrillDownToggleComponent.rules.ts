"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { MetricDrillDownToggleView } from "@/presentation/components/layout/MetricDrillDownToggle/MetricDrillDownToggleComponent.types";
import { useMessages } from "@/presentation/components/providers/MessagesProvider/MessagesProviderComponent";
import { useFeatureFlag } from "@/presentation/hooks/use-feature-flags/use-feature-flags";
import { useExclusiveSidePanel } from "@/presentation/hooks/use-side-panel/use-exclusive-side-panel";

export function useMetricDrillDownToggleRules(): MetricDrillDownToggleView {
	const triggerRef = useRef<HTMLButtonElement>(null);
	const enabled = useFeatureFlag("metric-drill-down");
	const pathname = usePathname();
	const isVisible = enabled && pathname === "/";
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
	useExclusiveSidePanel("metric-drill-down", isOpen && isVisible, close);
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
