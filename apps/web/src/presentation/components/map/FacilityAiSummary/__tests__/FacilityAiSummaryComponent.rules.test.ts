import { act, renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { FACILITY_DETAIL } from "@/application/test/facility-detail";
import { EN_MESSAGES } from "@/application/test/messages";
import type { BrowserLlmCallbacks } from "@/infrastructure/ai/browser-llm/browser-llm.types";
import { facilitySummaryCache } from "@/infrastructure/cache/local-storage/facility-summary/facility-summary-cache";
import { useFacilityAiSummaryRules } from "@/presentation/components/map/FacilityAiSummary/FacilityAiSummaryComponent.rules";
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

function renderRules(detail = FACILITY_DETAIL) {
	return renderHook((props) => useFacilityAiSummaryRules(props), {
		wrapper,
		initialProps: { detail, fallback: FALLBACK },
	});
}

function lastCallbacks(): BrowserLlmCallbacks {
	return llm.generate.mock.lastCall?.[1];
}

describe("useFacilityAiSummaryRules", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		facilitySummaryCache.clear();
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
		expect(result.current.text).toBe(FALLBACK);

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
		facilitySummaryCache.write(facilitySummaryCache.keyFor(FACILITY_DETAIL, "en"), "Cached.");
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
			detail: { ...FACILITY_DETAIL, facility: { ...FACILITY_DETAIL.facility, id: "890" } },
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
});
