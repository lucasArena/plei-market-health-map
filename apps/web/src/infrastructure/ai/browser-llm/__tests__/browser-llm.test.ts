import {
	BROWSER_LLM_MODEL_ID,
	BrowserLlm,
	browserLlm,
} from "@/infrastructure/ai/browser-llm/browser-llm";

const webLlm = vi.hoisted(() => ({
	hasModelInCache: vi.fn(),
	CreateWebWorkerMLCEngine: vi.fn(),
}));

vi.mock("@mlc-ai/web-llm", () => webLlm);

const workers: Array<{ url: URL; options: unknown; terminate: ReturnType<typeof vi.fn> }> = [];

class MockWorker {
	terminate = vi.fn();
	constructor(url: URL, options: unknown) {
		workers.push({ url, options, terminate: this.terminate });
	}
}

function chunkStream(parts: string[]) {
	return (async function* () {
		for (const part of parts) yield { choices: [{ delta: { content: part } }] };
		yield { choices: [] };
	})();
}

function fakeEngine(parts: string[]) {
	return {
		chat: { completions: { create: vi.fn().mockResolvedValue(chunkStream(parts)) } },
		interruptGenerate: vi.fn(),
	};
}

function callbacks(signal = new AbortController().signal) {
	return { signal, onProgress: vi.fn(), onText: vi.fn() };
}

const MESSAGES = [{ role: "user" as const, content: "facts" }];

function createLlm() {
	return new BrowserLlm();
}

describe("BrowserLlm", () => {
	it("shares one engine across the app", () => {
		expect(browserLlm).toBeInstanceOf(BrowserLlm);
	});

	beforeEach(() => {
		vi.clearAllMocks();
		workers.length = 0;
		vi.stubGlobal("Worker", MockWorker);
		Object.defineProperty(navigator, "gpu", { value: {}, configurable: true });
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		Reflect.deleteProperty(navigator, "gpu");
	});

	it("needs WebGPU and workers", async () => {
		const llm = createLlm();
		expect(llm.isSupported()).toBe(true);
		Reflect.deleteProperty(navigator, "gpu");
		expect(llm.isSupported()).toBe(false);
	});

	it("reports whether the model is already downloaded", async () => {
		const llm = createLlm();
		webLlm.hasModelInCache.mockResolvedValueOnce(true).mockRejectedValueOnce(new Error("no cache"));
		expect(await llm.isReady()).toBe(true);
		expect(webLlm.hasModelInCache).toHaveBeenCalledWith(BROWSER_LLM_MODEL_ID);
		expect(await llm.isReady()).toBe(false);
	});

	it("loads the model once in a worker and streams the summary", async () => {
		const llm = createLlm();
		const engine = fakeEngine(["Busy ", "week."]);
		webLlm.CreateWebWorkerMLCEngine.mockImplementation(async (_worker, _id, config) => {
			config.initProgressCallback({ progress: 0.5, timeElapsed: 1, text: "" });
			return engine;
		});
		const first = callbacks();

		expect(await llm.generate(MESSAGES, first)).toBe("Busy week.");
		expect(first.onProgress).toHaveBeenCalledWith(0.5);
		expect(first.onText).toHaveBeenLastCalledWith("Busy week.");
		expect(workers).toHaveLength(1);
		expect(workers[0]?.options).toEqual({ type: "module" });
		expect(engine.chat.completions.create).toHaveBeenCalledWith(
			expect.objectContaining({ messages: MESSAGES, stream: true }),
		);

		engine.chat.completions.create.mockResolvedValue(chunkStream(["Again."]));
		expect(await llm.generate(MESSAGES, callbacks())).toBe("Again.");
		expect(webLlm.CreateWebWorkerMLCEngine).toHaveBeenCalledTimes(1);
		expect(await llm.isReady()).toBe(true);
	});

	it("stops streaming when aborted", async () => {
		const llm = createLlm();
		const engine = fakeEngine(["One ", "two"]);
		webLlm.CreateWebWorkerMLCEngine.mockResolvedValue(engine);
		const controller = new AbortController();
		const handlers = callbacks(controller.signal);
		handlers.onText.mockImplementation(() => controller.abort());

		expect(await llm.generate(MESSAGES, handlers)).toBe("One");
		expect(engine.interruptGenerate).toHaveBeenCalled();
	});

	it("skips work for requests aborted before or while loading", async () => {
		const llm = createLlm();
		const aborted = new AbortController();
		aborted.abort();
		expect(await llm.generate(MESSAGES, callbacks(aborted.signal))).toBe("");
		expect(workers).toHaveLength(0);

		const engine = fakeEngine(["x"]);
		const loading = new AbortController();
		webLlm.CreateWebWorkerMLCEngine.mockImplementation(async () => {
			loading.abort();
			return engine;
		});
		expect(await llm.generate(MESSAGES, callbacks(loading.signal))).toBe("");
		expect(engine.chat.completions.create).not.toHaveBeenCalled();
	});

	it("drops a failed engine so the next request retries", async () => {
		const llm = createLlm();
		webLlm.CreateWebWorkerMLCEngine.mockRejectedValueOnce(new Error("no adapter"));

		await expect(llm.generate(MESSAGES, callbacks())).rejects.toThrow("no adapter");
		expect(workers[0]?.terminate).toHaveBeenCalled();

		webLlm.CreateWebWorkerMLCEngine.mockResolvedValue(fakeEngine(["Ok"]));
		expect(await llm.generate(MESSAGES, callbacks())).toBe("Ok");
		expect(workers).toHaveLength(2);
	});

	it("accepts its own model, WebLLM loader and worker", async () => {
		const worker = { terminate: vi.fn() } as unknown as Worker;
		const engine = fakeEngine(["Custom."]);
		const createEngine = vi.fn().mockResolvedValue(engine);
		const loadWebLlm = vi.fn().mockResolvedValue({
			hasModelInCache: vi.fn().mockResolvedValue(false),
			CreateWebWorkerMLCEngine: createEngine,
		});
		const llm = new BrowserLlm({ modelId: "tiny-model", loadWebLlm, createWorker: () => worker });

		expect(await llm.isReady()).toBe(false);
		expect(await llm.generate(MESSAGES, callbacks())).toBe("Custom.");
		expect(createEngine).toHaveBeenCalledWith(worker, "tiny-model", expect.anything());
		expect(workers).toHaveLength(0);
	});
});
