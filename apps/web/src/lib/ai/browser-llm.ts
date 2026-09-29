import type { WebWorkerMLCEngine } from "@mlc-ai/web-llm";
import type { BrowserLlmCallbacks, LlmMessage } from "@/lib/ai/browser-llm.types";

export const BROWSER_LLM_MODEL_ID = "Llama-3.2-1B-Instruct-q4f16_1-MLC";

const progressListeners = new Set<(progress: number) => void>();
let enginePromise: Promise<WebWorkerMLCEngine> | null = null;
let queue: Promise<unknown> = Promise.resolve();

export function isBrowserLlmSupported(): boolean {
	return typeof Worker !== "undefined" && "gpu" in navigator;
}

export async function isBrowserLlmReady(): Promise<boolean> {
	if (enginePromise) return true;
	try {
		const { hasModelInCache } = await import("@mlc-ai/web-llm");
		return await hasModelInCache(BROWSER_LLM_MODEL_ID);
	} catch {
		return false;
	}
}

function createEngine(): Promise<WebWorkerMLCEngine> {
	const worker = new Worker(new URL("./browser-llm.worker.ts", import.meta.url), {
		type: "module",
	});
	return import("@mlc-ai/web-llm")
		.then(({ CreateWebWorkerMLCEngine }) =>
			CreateWebWorkerMLCEngine(worker, BROWSER_LLM_MODEL_ID, {
				initProgressCallback: ({ progress }) => {
					for (const listener of progressListeners) listener(progress);
				},
			}),
		)
		.catch((error: unknown) => {
			worker.terminate();
			enginePromise = null;
			throw error;
		});
}

async function loadEngine(onProgress: (progress: number) => void): Promise<WebWorkerMLCEngine> {
	progressListeners.add(onProgress);
	try {
		enginePromise ??= createEngine();
		return await enginePromise;
	} finally {
		progressListeners.delete(onProgress);
	}
}

async function streamSummary(
	engine: WebWorkerMLCEngine,
	messages: LlmMessage[],
	{ signal, onText }: BrowserLlmCallbacks,
): Promise<string> {
	const chunks = await engine.chat.completions.create({
		messages,
		stream: true,
		temperature: 0,
		max_tokens: 180,
	});
	let text = "";
	for await (const chunk of chunks) {
		if (signal.aborted) {
			engine.interruptGenerate();
			break;
		}
		text += chunk.choices[0]?.delta?.content ?? "";
		onText(text);
	}
	return text.trim();
}

export function generateWithBrowserLlm(
	messages: LlmMessage[],
	callbacks: BrowserLlmCallbacks,
): Promise<string> {
	const run = async () => {
		if (callbacks.signal.aborted) return "";
		const engine = await loadEngine(callbacks.onProgress);
		if (callbacks.signal.aborted) return "";
		return streamSummary(engine, messages, callbacks);
	};
	const result = queue.then(run, run);
	queue = result.catch(() => undefined);
	return result;
}
