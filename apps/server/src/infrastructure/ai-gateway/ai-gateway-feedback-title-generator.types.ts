import type { LanguageModel } from "ai";

export interface AiGatewayFeedbackTitleGeneratorOptions {
	model: LanguageModel;
	timeoutMs?: number;
	log?: (message: string, detail: string) => void;
}
