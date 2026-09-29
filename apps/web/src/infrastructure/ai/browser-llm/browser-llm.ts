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
		const run = async () => {
			if (callbacks.signal.aborted) return "";
			const engine = await this.loadEngine(callbacks.onProgress);
			if (callbacks.signal.aborted) return "";
			return this.stream(engine, messages, callbacks);
		};
		const result = this.queue.then(run, run);
		this.queue = result.catch(() => undefined);
		return result;
	}

	private async loadEngine(onProgress: ProgressListener): Promise<WebWorkerMLCEngine> {
		this.progressListeners.add(onProgress);
		try {
			this.enginePromise ??= this.createEngine();
			return await this.enginePromise;
		} finally {
			this.progressListeners.delete(onProgress);
		}
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
				throw error;
			});
	}

	private reportProgress(progress: number): void {
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
