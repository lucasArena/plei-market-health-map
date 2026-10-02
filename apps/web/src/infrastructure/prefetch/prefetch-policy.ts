import type {
	CancelIdle,
	NetworkInformationLike,
} from "@/infrastructure/prefetch/prefetch-policy.types";

export const IDLE_FALLBACK_DELAY_MS = 1500;
export const IDLE_TIMEOUT_MS = 4000;

const SLOW_CONNECTIONS = ["slow-2g", "2g"];

export function canPrefetchInBackground(connection?: NetworkInformationLike): boolean {
	const network =
		connection ??
		(globalThis.navigator as { connection?: NetworkInformationLike } | undefined)?.connection;
	if (!network) return true;
	if (network.saveData) return false;
	return !SLOW_CONNECTIONS.includes(network.effectiveType ?? "");
}

export function whenIdle(callback: () => void): CancelIdle {
	if (typeof window.requestIdleCallback === "function") {
		const handle = window.requestIdleCallback(callback, { timeout: IDLE_TIMEOUT_MS });
		return () => window.cancelIdleCallback(handle);
	}
	const handle = window.setTimeout(callback, IDLE_FALLBACK_DELAY_MS);
	return () => window.clearTimeout(handle);
}
