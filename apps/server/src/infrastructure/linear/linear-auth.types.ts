import type { FetchLike } from "@server/infrastructure/linear/linear-issue-tracker.types";

export type LinearAuthMode = "app" | "api-key";

export interface LinearAuth {
	readonly mode: LinearAuthMode;
	authorization(): Promise<string>;
	invalidate(): void;
}

export interface LinearAppAuthOptions {
	clientId: string;
	clientSecret: string;
	scope?: string;
	fetch?: FetchLike;
	now?: () => number;
	timeoutMs?: number;
}
