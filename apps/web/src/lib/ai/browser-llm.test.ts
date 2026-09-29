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

async function loadModule() {
	vi.resetModules();
	return import("@/lib/ai/browser-llm");
}

describe("browser-llm", () => {
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
		const { isBrowserLlmSupported } = await loadModule();
		expect(isBrowserLlmSupported()).toBe(true);
		Reflect.deleteProperty(navigator, "gpu");
		expect(isBrowserLlmSupported()).toBe(false);
	});

	it("reports whether the model is already downloaded", async () => {
		const { isBrowserLlmReady, BROWSER_LLM_MODEL_ID } = await loadModule();
		webLlm.hasModelInCache.mockResolvedValueOnce(true).mockRejectedValueOnce(new Error("no cache"));
		expect(await isBrowserLlmReady()).toBe(true);
		expect(webLlm.hasModelInCache).toHaveBeenCalledWith(BROWSER_LLM_MODEL_ID);
		expect(await isBrowserLlmReady()).toBe(false);
	});

	it("loads the model once in a worker and streams the summary", async () => {
		const { generateWithBrowserLlm, isBrowserLlmReady } = await loadModule();
		const engine = fakeEngine(["Busy ", "week."]);
		webLlm.CreateWebWorkerMLCEngine.mockImplementation(async (_worker, _id, config) => {
			config.initProgressCallback({ progress: 0.5, timeElapsed: 1, text: "" });
			return engine;
		});
		const first = callbacks();

		expect(await generateWithBrowserLlm(MESSAGES, first)).toBe("Busy week.");
		expect(first.onProgress).toHaveBeenCalledWith(0.5);
		expect(first.onText).toHaveBeenLastCalledWith("Busy week.");
		expect(workers).toHaveLength(1);
		expect(workers[0]?.options).toEqual({ type: "module" });
		expect(engine.chat.completions.create).toHaveBeenCalledWith(
			expect.objectContaining({ messages: MESSAGES, stream: true }),
		);

		engine.chat.completions.create.mockResolvedValue(chunkStream(["Again."]));
		expect(await generateWithBrowserLlm(MESSAGES, callbacks())).toBe("Again.");
		expect(webLlm.CreateWebWorkerMLCEngine).toHaveBeenCalledTimes(1);
		expect(await isBrowserLlmReady()).toBe(true);
	});

	it("stops streaming when aborted", async () => {
		const { generateWithBrowserLlm } = await loadModule();
		const engine = fakeEngine(["One ", "two"]);
		webLlm.CreateWebWorkerMLCEngine.mockResolvedValue(engine);
		const controller = new AbortController();
		const handlers = callbacks(controller.signal);
		handlers.onText.mockImplementation(() => controller.abort());

		expect(await generateWithBrowserLlm(MESSAGES, handlers)).toBe("One");
		expect(engine.interruptGenerate).toHaveBeenCalled();
	});

	it("skips work for requests aborted before or while loading", async () => {
		const { generateWithBrowserLlm } = await loadModule();
		const aborted = new AbortController();
		aborted.abort();
		expect(await generateWithBrowserLlm(MESSAGES, callbacks(aborted.signal))).toBe("");
		expect(workers).toHaveLength(0);

		const engine = fakeEngine(["x"]);
		const loading = new AbortController();
		webLlm.CreateWebWorkerMLCEngine.mockImplementation(async () => {
			loading.abort();
			return engine;
		});
		expect(await generateWithBrowserLlm(MESSAGES, callbacks(loading.signal))).toBe("");
		expect(engine.chat.completions.create).not.toHaveBeenCalled();
	});

	it("drops a failed engine so the next request retries", async () => {
		const { generateWithBrowserLlm } = await loadModule();
		webLlm.CreateWebWorkerMLCEngine.mockRejectedValueOnce(new Error("no adapter"));

		await expect(generateWithBrowserLlm(MESSAGES, callbacks())).rejects.toThrow("no adapter");
		expect(workers[0]?.terminate).toHaveBeenCalled();

		webLlm.CreateWebWorkerMLCEngine.mockResolvedValue(fakeEngine(["Ok"]));
		expect(await generateWithBrowserLlm(MESSAGES, callbacks())).toBe("Ok");
		expect(workers).toHaveLength(2);
	});
});
