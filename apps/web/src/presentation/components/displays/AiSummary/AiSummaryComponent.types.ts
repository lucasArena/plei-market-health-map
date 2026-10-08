import type { LlmMessage } from "@/infrastructure/ai/browser-llm/browser-llm.types";
import type { InsightChecks } from "@/infrastructure/ai/insight-check/insight-check.types";
import type { InsightTone } from "@/presentation/components/displays/KeyInsights/KeyInsightsComponent.types";

export interface AiSummaryContext {
	cacheKey: string;
	prompt: LlmMessage[];
	checks?: InsightChecks;
}

export interface AiSummaryProps {
	context: AiSummaryContext;
	fallback: string;
	introFirst?: boolean;
	title?: string;
	tone?: InsightTone;
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
