"use client";

import { useCallback, useEffect, useRef } from "react";

export const INTENT_DELAY_MS = 150;

export function useIntentPrefetch(delayMs: number = INTENT_DELAY_MS) {
	const timerRef = useRef<number | null>(null);

	const cancel = useCallback(() => {
		if (timerRef.current !== null) window.clearTimeout(timerRef.current);
		timerRef.current = null;
	}, []);

	const schedule = useCallback(
		(prefetch: () => void) => {
			cancel();
			timerRef.current = window.setTimeout(() => {
				timerRef.current = null;
				prefetch();
			}, delayMs);
		},
		[cancel, delayMs],
	);

	useEffect(() => cancel, [cancel]);

	return { cancel, schedule };
}
