import {
	AiGatewayFeedbackTitleGenerator,
	FEEDBACK_TITLE_INSTRUCTIONS,
} from "@server/infrastructure/ai-gateway/ai-gateway-feedback-title-generator";
import { MockLanguageModelV4 } from "ai/test";

function textResult(text: string) {
	return {
		content: [{ type: "text" as const, text }],
		finishReason: { unified: "stop" as const, raw: "stop" },
		usage: {
			inputTokens: { total: 40, noCache: 40, cacheRead: 0, cacheWrite: 0 },
			outputTokens: { total: 6, text: 6, reasoning: 0 },
		},
		warnings: [],
	};
}

type CallOptions = MockLanguageModelV4["doGenerateCalls"][number];

function promptText(call: CallOptions | undefined): string {
	return JSON.stringify(call?.prompt ?? []);
}

describe("AiGatewayFeedbackTitleGenerator", () => {
	it("returns the model's title and sends the type and message", async () => {
		const model = new MockLanguageModelV4({
			doGenerate: textResult("Map pins overlap at high zoom"),
		});
		const generator = new AiGatewayFeedbackTitleGenerator({ model });

		const title = await generator.generateTitle({
			type: "bug",
			message: "When I zoom in a lot the pins sit on top of each other and I can't click them.",
		});

		expect(title).toBe("Map pins overlap at high zoom");
		const call = model.doGenerateCalls[0];
		expect(promptText(call)).toContain(JSON.stringify(FEEDBACK_TITLE_INSTRUCTIONS).slice(1, -1));
		expect(promptText(call)).toContain("Type: bug report");
		expect(promptText(call)).toContain("the pins sit on top of each other");
		expect(call?.maxOutputTokens).toBe(32);
	});

	it("labels improvements as improvement ideas", async () => {
		const model = new MockLanguageModelV4({ doGenerate: textResult("Add a market filter") });
		const generator = new AiGatewayFeedbackTitleGenerator({ model });

		await expect(
			generator.generateTitle({ type: "improvement", message: "Let me filter by market" }),
		).resolves.toBe("Add a market filter");
		expect(promptText(model.doGenerateCalls[0])).toContain("Type: improvement idea");
	});

	it("returns null and logs when the model fails", async () => {
		const log = vi.fn();
		const model = new MockLanguageModelV4({
			doGenerate: () => Promise.reject(new Error("gateway down")),
		});
		const generator = new AiGatewayFeedbackTitleGenerator({ model, log });

		await expect(
			generator.generateTitle({ type: "bug", message: "Blank map" }),
		).resolves.toBeNull();
		expect(log).toHaveBeenCalledWith(
			expect.stringContaining("title generation failed"),
			"gateway down",
		);
	});

	it("gives up after the timeout and returns null", async () => {
		const log = vi.fn();
		const model = new MockLanguageModelV4({
			doGenerate: ({ abortSignal }) =>
				new Promise((_resolve, reject) => {
					abortSignal?.addEventListener("abort", () => reject(abortSignal.reason));
				}),
		});
		const generator = new AiGatewayFeedbackTitleGenerator({ model, timeoutMs: 20, log });

		const started = Date.now();
		const title = await generator.generateTitle({ type: "improvement", message: "Slow" });

		expect(title).toBeNull();
		expect(Date.now() - started).toBeLessThan(1000);
		expect(log).toHaveBeenCalledOnce();
	});

	it("logs non-Error failures as text", async () => {
		const log = vi.fn();
		const model = new MockLanguageModelV4({ doGenerate: () => Promise.reject("nope") });
		const generator = new AiGatewayFeedbackTitleGenerator({ model, log });

		await expect(generator.generateTitle({ type: "bug", message: "x" })).resolves.toBeNull();
		expect(log).toHaveBeenCalledWith(expect.any(String), "nope");
	});

	it("warns on the console by default", async () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
		const model = new MockLanguageModelV4({ doGenerate: () => Promise.reject(new Error("401")) });

		await new AiGatewayFeedbackTitleGenerator({ model }).generateTitle({
			type: "bug",
			message: "x",
		});

		expect(warn).toHaveBeenCalledWith(expect.stringContaining("generic title"), "401");
		warn.mockRestore();
	});
});
