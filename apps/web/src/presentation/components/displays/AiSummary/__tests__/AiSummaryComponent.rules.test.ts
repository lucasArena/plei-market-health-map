import { act, renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { FACILITY_DETAIL } from "@/application/test/facility-detail";
import { EN_MESSAGES } from "@/application/test/messages";
import type { BrowserLlmCallbacks } from "@/infrastructure/ai/browser-llm/browser-llm.types";
import { aiSummaryCache } from "@/infrastructure/cache/local-storage/ai-summary/ai-summary-cache";
import {
	aiSummaryContextFor,
	summaryTextFor,
	useAiSummaryRules,
} from "@/presentation/components/displays/AiSummary/AiSummaryComponent.rules";
import { MessagesProvider } from "@/presentation/components/providers/MessagesProvider/MessagesProviderComponent";

const llm = vi.hoisted(() => ({
	isSupported: vi.fn(),
	isReady: vi.fn(),
	generate: vi.fn(),
}));

vi.mock("@/infrastructure/ai/browser-llm/browser-llm", () => ({ browserLlm: llm }));

const FALLBACK = "55 games played last week.";

function wrapper({ children }: { children: ReactNode }) {
	return createElement(MessagesProvider, { locale: "en", messages: EN_MESSAGES, children });
}

function contextFor(detail = FACILITY_DETAIL) {
	return aiSummaryContextFor(
		{ kind: "facility", id: detail.facility.id, name: detail.facility.name, stats: detail.stats },
		"en",
	);
}

function renderRules(detail = FACILITY_DETAIL) {
	return renderHook((props) => useAiSummaryRules(props), {
		wrapper,
		initialProps: { context: contextFor(detail), fallback: FALLBACK },
	});
}

function lastCallbacks(): BrowserLlmCallbacks {
	return llm.generate.mock.lastCall?.[1];
}

describe("useAiSummaryRules", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		aiSummaryCache.clear();
		llm.isSupported.mockReturnValue(true);
		llm.isReady.mockResolvedValue(true);
	});

	it("shows the standard summary where WebGPU is missing", async () => {
		llm.isSupported.mockReturnValue(false);
		const { result } = renderRules();

		await waitFor(() => expect(result.current.status).toBe("unsupported"));
		expect(result.current.text).toBe(FALLBACK);
		expect(llm.generate).not.toHaveBeenCalled();
	});

	it("waits for consent before the first model download", async () => {
		llm.isReady.mockResolvedValue(false);
		llm.generate.mockResolvedValue("Healthy week.");
		const { result } = renderRules();

		await waitFor(() => expect(result.current.status).toBe("idle"));
		expect(llm.generate).not.toHaveBeenCalled();

		act(() => result.current.handleGenerate());

		await waitFor(() => expect(result.current.status).toBe("ready"));
		expect(result.current.text).toBe("Healthy week.");
	});

	it("reports download progress, streams text and caches the result", async () => {
		let finish: (text: string) => void = () => undefined;
		llm.generate.mockReturnValue(
			new Promise((resolve) => {
				finish = resolve;
			}),
		);
		const { result, unmount } = renderRules();

		await waitFor(() => expect(result.current.status).toBe("loading"));
		act(() => lastCallbacks().onProgress(0.426));
		expect(result.current.progressPercent).toBe(43);
		expect(result.current.progressLabel).toBe("Loading the AI model on this device… 43%");
		expect(result.current.text).toBeNull();

		act(() => lastCallbacks().onText("Pegaso HTX"));
		expect(result.current.status).toBe("generating");
		expect(result.current.text).toBe("Pegaso HTX");

		await act(async () => finish("Pegaso HTX had a busy week."));
		expect(result.current.status).toBe("ready");
		unmount();

		const again = renderRules();
		await waitFor(() => expect(again.result.current.status).toBe("ready"));
		expect(again.result.current.text).toBe("Pegaso HTX had a busy week.");
		expect(llm.generate).toHaveBeenCalledTimes(1);
	});

	it("uses a cached summary without touching the model", async () => {
		aiSummaryCache.write(contextFor().cacheKey, "Cached.");
		const { result } = renderRules();

		await waitFor(() => expect(result.current.status).toBe("ready"));
		expect(result.current.text).toBe("Cached.");
		expect(llm.isSupported).not.toHaveBeenCalled();
	});

	it("falls back when generation fails or returns nothing", async () => {
		llm.generate.mockRejectedValueOnce(new Error("lost device"));
		const failed = renderRules();
		await waitFor(() => expect(failed.result.current.status).toBe("error"));
		expect(failed.result.current.text).toBe(FALLBACK);
		failed.unmount();

		llm.generate.mockResolvedValueOnce("");
		const empty = renderRules();
		await waitFor(() => expect(empty.result.current.status).toBe("error"));
	});

	it("aborts the running summary when the facility changes", async () => {
		llm.generate.mockReturnValueOnce(new Promise(() => undefined));
		llm.generate.mockResolvedValueOnce("Other facility.");
		const { result, rerender } = renderRules();
		await waitFor(() => expect(llm.generate).toHaveBeenCalledTimes(1));
		const firstSignal = lastCallbacks().signal;
		const firstCallbacks = lastCallbacks();

		rerender({
			context: contextFor({
				...FACILITY_DETAIL,
				facility: { ...FACILITY_DETAIL.facility, id: "890" },
			}),
			fallback: FALLBACK,
		});

		expect(firstSignal.aborted).toBe(true);
		await waitFor(() => expect(result.current.text).toBe("Other facility."));
		act(() => firstCallbacks.onText("stale"));
		expect(result.current.text).toBe("Other facility.");
	});

	it("ignores a readiness answer that arrives after unmount", async () => {
		let answer: (ready: boolean) => void = () => undefined;
		llm.isReady.mockReturnValue(
			new Promise((resolve) => {
				answer = resolve;
			}),
		);
		const { unmount } = renderRules();
		unmount();
		await act(async () => answer(true));
		expect(llm.generate).not.toHaveBeenCalled();
	});

	it("builds a context whose cache key and prompt follow the subject", () => {
		const facility = contextFor();
		const market = aiSummaryContextFor(
			{
				kind: "market",
				id: "2",
				name: "Houston",
				stats: FACILITY_DETAIL.stats,
				scope: { facilityCount: 48, activeFacilityCount: 31, marketCount: 1, activeMarketCount: 1 },
			},
			"en",
		);

		expect(facility.cacheKey).toBe("v7:facility-889:2026-09-30:en");
		expect(market.cacheKey).toBe("v7:market-2:2026-09-30:en");
		expect(market.prompt.at(-1)?.content).toContain("Market: Houston.");
	});

	it("shows no template text while the model loads, waits for consent, or is checking", () => {
		expect(summaryTextFor({ status: "checking", text: null, progress: 0 }, FALLBACK)).toBeNull();
		expect(summaryTextFor({ status: "idle", text: null, progress: 0 }, FALLBACK)).toBeNull();
		expect(summaryTextFor({ status: "loading", text: null, progress: 0.4 }, FALLBACK)).toBeNull();
		expect(summaryTextFor({ status: "generating", text: "Busy", progress: 1 }, FALLBACK)).toBe(
			"Busy",
		);
		expect(summaryTextFor({ status: "unsupported", text: null, progress: 0 }, FALLBACK)).toBe(
			FALLBACK,
		);
		expect(summaryTextFor({ status: "error", text: null, progress: 0 }, FALLBACK)).toBe(FALLBACK);
	});

	it("expands, and measures whether the collapsed text overflows", async () => {
		aiSummaryCache.write(contextFor().cacheKey, "Cached.");
		const { result } = renderRules();
		await waitFor(() => expect(result.current.text).toBe("Cached."));
		expect(result.current.isOverflowing).toBe(false);

		act(() => result.current.toggleExpanded());
		expect(result.current.isExpanded).toBe(true);
		expect(result.current.isOverflowing).toBe(true);

		Object.assign(result.current.contentRef, {
			current: { scrollHeight: 300, clientHeight: 144 },
		});
		act(() => result.current.toggleExpanded());
		expect(result.current.isExpanded).toBe(false);
		expect(result.current.isOverflowing).toBe(true);
	});
});
