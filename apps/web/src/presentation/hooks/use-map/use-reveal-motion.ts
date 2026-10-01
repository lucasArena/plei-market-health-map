"use client";

import { type AnimationEvent, useCallback, useEffect, useRef, useState } from "react";
import type {
	RevealDuration,
	RevealMotion,
} from "@/presentation/hooks/use-map/use-reveal-motion.types";

export const REVEAL_MOTION_MS = {
	enter: 200,
	exit: 160,
} as const;

export const PANEL_SLIDE_MS = {
	enter: 320,
	exit: 220,
} as const;

export function useRevealMotion(visible: boolean, duration: RevealDuration = REVEAL_MOTION_MS) {
	const [motion, setMotion] = useState<RevealMotion>(visible ? "enter" : "hidden");
	const previousVisible = useRef(visible);

	useEffect(() => {
		if (previousVisible.current === visible) return;
		previousVisible.current = visible;
		setMotion(visible ? "enter" : "exit");
	}, [visible]);

	const finishReveal = useCallback((event: AnimationEvent<HTMLElement>) => {
		if (event.target !== event.currentTarget) return;
		setMotion((current) => {
			if (current === "enter") return "shown";
			if (current === "exit") return "hidden";
			return current;
		});
	}, []);

	useEffect(() => {
		if (motion !== "enter" && motion !== "exit") return;
		const next = { enter: "shown", exit: "hidden" } as const;
		const timer = window.setTimeout(() => setMotion(next[motion]), duration[motion]);
		return () => window.clearTimeout(timer);
	}, [duration, motion]);

	return { finishReveal, isShown: motion !== "hidden", motion };
}
