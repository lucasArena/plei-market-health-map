import type { CreateWebWorkerMLCEngine, hasModelInCache } from "@mlc-ai/web-llm";

export interface LlmMessage {
	role: "system" | "user" | "assistant";
	content: string;
}

export interface BrowserLlmCallbacks {
	signal: AbortSignal;
	onProgress: (progress: number) => void;
	onText: (text: string) => void;
}

export interface WebLlmModule {
	hasModelInCache: typeof hasModelInCache;
	CreateWebWorkerMLCEngine: typeof CreateWebWorkerMLCEngine;
}

export interface BrowserLlmOptions {
	modelId?: string;
	loadWebLlm?: () => Promise<WebLlmModule>;
	createWorker?: () => Worker;
}

export type ProgressListener = (progress: number) => void;
