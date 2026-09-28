import type { LoginEventView } from "@market-health-map/application";

export interface RecentLoginsProps {
	limit?: number;
}

export interface RecentLoginRow extends LoginEventView {
	signedInLabel: string;
}

export type RecentLoginsStatus = "loading" | "error" | "empty" | "ready";
