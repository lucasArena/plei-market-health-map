import type { WebWorkerMLCEngine } from "@mlc-ai/web-llm";
import type {
	BrowserLlmCallbacks,
	BrowserLlmOptions,
	LlmMessage,
	ProgressListener,
	WebLlmModule,
} from "@/infrastructure/ai/browser-llm/browser-llm.types";

export const BROWSER_LLM_MODEL_ID = "Llama-3.2-1B-Instruct-q4f16_1-MLC";

function createBrowserLlmWorker(): Worker {
	return new Worker(new URL("./browser-llm.worker.ts", import.meta.url), { type: "module" });
}

export class BrowserLlm {
	private readonly modelId: string;
	private readonly loadWebLlm: () => Promise<WebLlmModule>;
	private readonly createWorker: () => Worker;
	private readonly progressListeners = new Set<ProgressListener>();
	private enginePromise: Promise<WebWorkerMLCEngine> | null = null;
	private latestProgress = 0;
	private queue: Promise<unknown> = Promise.resolve();

	constructor({
		modelId = BROWSER_LLM_MODEL_ID,
		loadWebLlm = () => import("@mlc-ai/web-llm"),
		createWorker = createBrowserLlmWorker,
	}: BrowserLlmOptions = {}) {
		this.modelId = modelId;
		this.loadWebLlm = loadWebLlm;
		this.createWorker = createWorker;
	}

	isSupported(): boolean {
		return typeof Worker !== "undefined" && "gpu" in navigator;
	}

	async isReady(): Promise<boolean> {
		if (this.enginePromise) return true;
		try {
			const { hasModelInCache } = await this.loadWebLlm();
			return await hasModelInCache(this.modelId);
		} catch {
			return false;
		}
	}

	generate(messages: LlmMessage[], callbacks: BrowserLlmCallbacks): Promise<string> {
		const stopListening = this.listenForProgress(callbacks);
		const run = async () => {
			if (callbacks.signal.aborted) return "";
			this.enginePromise ??= this.createEngine();
			const engine = await this.enginePromise;
			if (callbacks.signal.aborted) return "";
			return this.stream(engine, messages, callbacks);
		};
		const result = this.queue.then(run, run).finally(stopListening);
		this.queue = result.catch(() => undefined);
		return result;
	}

	private listenForProgress({ onProgress, signal }: BrowserLlmCallbacks): () => void {
		const stopListening = () => {
			this.progressListeners.delete(onProgress);
			signal.removeEventListener("abort", stopListening);
		};
		this.progressListeners.add(onProgress);
		signal.addEventListener("abort", stopListening);
		if (this.enginePromise) onProgress(this.latestProgress);
		return stopListening;
	}

	private createEngine(): Promise<WebWorkerMLCEngine> {
		const worker = this.createWorker();
		return this.loadWebLlm()
			.then(({ CreateWebWorkerMLCEngine }) =>
				CreateWebWorkerMLCEngine(worker, this.modelId, {
					initProgressCallback: ({ progress }) => this.reportProgress(progress),
				}),
			)
			.catch((error: unknown) => {
				worker.terminate();
				this.enginePromise = null;
				this.latestProgress = 0;
				throw error;
			});
	}

	private reportProgress(progress: number): void {
		this.latestProgress = progress;
		for (const listener of this.progressListeners) listener(progress);
	}

	private async stream(
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
}

export const browserLlm = new BrowserLlm();
