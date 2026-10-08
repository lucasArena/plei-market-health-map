"use client";

import { useCallback, useEffect, useState } from "react";

export function overflowsWhenCollapsed(element: HTMLElement): boolean {
	return element.scrollHeight > element.clientHeight + 1;
}

export function useHealthStripRules() {
	const [content, contentRef] = useState<HTMLDivElement | null>(null);
	const [isExpanded, setIsExpanded] = useState(false);
	const [canExpand, setCanExpand] = useState(false);

	const toggle = useCallback(() => setIsExpanded((current) => !current), []);

	useEffect(() => {
		if (!content || isExpanded) return;
		const measure = () => setCanExpand(overflowsWhenCollapsed(content));
		measure();
		const observer = new MutationObserver(measure);
		observer.observe(content, { childList: true, subtree: true, characterData: true });
		return () => observer.disconnect();
	}, [content, isExpanded]);

	return { canExpand, contentRef, isCollapsed: canExpand && !isExpanded, isExpanded, toggle };
}
