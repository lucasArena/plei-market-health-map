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
	const [isOpen, setIsOpen] = useState(false);
	const close = useCallback(() => setIsOpen(false), []);
	const toggle = useCallback(() => setIsOpen((current) => !current), []);
	useExclusiveSidePanel("metric-drill-down", isOpen && isVisible, close);
	useEffect(() => {
		if (!isVisible) close();
	}, [close, isVisible]);
	const { messages } = useMessages();
	return {
		triggerRef,
		isOpen: isOpen && isVisible,
		isVisible,
		close,
		toggle,
		label: messages.drillDown.title,
	};
}
