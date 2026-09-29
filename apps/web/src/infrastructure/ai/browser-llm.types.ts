export interface LlmMessage {
	role: "system" | "user" | "assistant";
	content: string;
}

export interface BrowserLlmCallbacks {
	signal: AbortSignal;
	onProgress: (progress: number) => void;
	onText: (text: string) => void;
}
