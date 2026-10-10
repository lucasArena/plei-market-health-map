"use client";

import { useSyncExternalStore } from "react";

export const SYSTEM_THEME_QUERY = "(prefers-color-scheme: dark)";

export function systemPrefersDark() {
	return typeof window !== "undefined" && window.matchMedia?.(SYSTEM_THEME_QUERY).matches === true;
}

function subscribe(onChange: () => void) {
	const query = window.matchMedia?.(SYSTEM_THEME_QUERY);
	query?.addEventListener("change", onChange);
	return () => query?.removeEventListener("change", onChange);
}

export function useSystemTheme() {
	return useSyncExternalStore(subscribe, systemPrefersDark, () => false);
}
