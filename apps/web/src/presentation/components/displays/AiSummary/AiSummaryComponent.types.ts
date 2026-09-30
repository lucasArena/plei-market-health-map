import type { LlmMessage } from "@/infrastructure/ai/browser-llm/browser-llm.types";

export interface AiSummaryContext {
	cacheKey: string;
	prompt: LlmMessage[];
}

export interface AiSummaryProps {
	context: AiSummaryContext;
	fallback: string;
}

export type AiSummaryStatus =
	| "checking"
	| "unsupported"
	| "idle"
	| "loading"
	| "generating"
	| "ready"
	| "error";

export interface AiSummaryState {
	status: AiSummaryStatus;
	text: string | null;
	progress: number;
}
