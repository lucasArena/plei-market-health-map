const handler = vi.hoisted(() => ({ onmessage: vi.fn() }));

vi.mock("@mlc-ai/web-llm", () => ({
	WebWorkerMLCEngineHandler: class {
		onmessage = handler.onmessage;
	},
}));

describe("browser-llm worker", () => {
	it("forwards messages to the WebLLM handler", async () => {
		await import("@/lib/ai/browser-llm.worker");
		const message = new MessageEvent("message", { data: { kind: "reload" } });

		self.onmessage?.(message);

		expect(handler.onmessage).toHaveBeenCalledWith(message);
	});
});
