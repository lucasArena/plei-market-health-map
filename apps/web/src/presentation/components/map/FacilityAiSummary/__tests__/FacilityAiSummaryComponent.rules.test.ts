import { act, renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { FACILITY_DETAIL } from "@/application/test/facility-detail";
import { EN_MESSAGES } from "@/application/test/messages";
import type { BrowserLlmCallbacks } from "@/infrastructure/ai/browser-llm.types";
import {
	clearCachedSummaries,
	writeCachedSummary,
} from "@/infrastructure/ai/facility-summary-cache";
import { MessagesProvider } from "@/presentation/components/i18n/MessagesProvider/MessagesProviderComponent";
import { useFacilityAiSummaryRules } from "@/presentation/components/map/FacilityAiSummary/FacilityAiSummaryComponent.rules";

const llm = vi.hoisted(() => ({
	isBrowserLlmSupported: vi.fn(),
	isBrowserLlmReady: vi.fn(),
	generateWithBrowserLlm: vi.fn(),
}));

vi.mock("@/infrastructure/ai/browser-llm", () => llm);

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
	return llm.generateWithBrowserLlm.mock.lastCall?.[1];
}

describe("useFacilityAiSummaryRules", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		clearCachedSummaries();
		llm.isBrowserLlmSupported.mockReturnValue(true);
		llm.isBrowserLlmReady.mockResolvedValue(true);
	});

	it("shows the standard summary where WebGPU is missing", async () => {
		llm.isBrowserLlmSupported.mockReturnValue(false);
		const { result } = renderRules();

		await waitFor(() => expect(result.current.status).toBe("unsupported"));
		expect(result.current.text).toBe(FALLBACK);
		expect(llm.generateWithBrowserLlm).not.toHaveBeenCalled();
	});

	it("waits for consent before the first model download", async () => {
		llm.isBrowserLlmReady.mockResolvedValue(false);
		llm.generateWithBrowserLlm.mockResolvedValue("Healthy week.");
		const { result } = renderRules();

		await waitFor(() => expect(result.current.status).toBe("idle"));
		expect(llm.generateWithBrowserLlm).not.toHaveBeenCalled();

		act(() => result.current.handleGenerate());

		await waitFor(() => expect(result.current.status).toBe("ready"));
		expect(result.current.text).toBe("Healthy week.");
	});

	it("reports download progress, streams text and caches the result", async () => {
		let finish: (text: string) => void = () => undefined;
		llm.generateWithBrowserLlm.mockReturnValue(
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
		expect(llm.generateWithBrowserLlm).toHaveBeenCalledTimes(1);
	});

	it("uses a cached summary without touching the model", async () => {
		writeCachedSummary("889:2026-09-21:en", "Cached.");
		const { result } = renderRules();

		expect(result.current.status).toBe("ready");
		expect(result.current.text).toBe("Cached.");
		expect(llm.isBrowserLlmSupported).not.toHaveBeenCalled();
	});

	it("falls back when generation fails or returns nothing", async () => {
		llm.generateWithBrowserLlm.mockRejectedValueOnce(new Error("lost device"));
		const failed = renderRules();
		await waitFor(() => expect(failed.result.current.status).toBe("error"));
		expect(failed.result.current.text).toBe(FALLBACK);
		failed.unmount();

		llm.generateWithBrowserLlm.mockResolvedValueOnce("");
		const empty = renderRules();
		await waitFor(() => expect(empty.result.current.status).toBe("error"));
	});

	it("aborts the running summary when the facility changes", async () => {
		llm.generateWithBrowserLlm.mockReturnValueOnce(new Promise(() => undefined));
		llm.generateWithBrowserLlm.mockResolvedValueOnce("Other facility.");
		const { result, rerender } = renderRules();
		await waitFor(() => expect(llm.generateWithBrowserLlm).toHaveBeenCalledTimes(1));
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
		llm.isBrowserLlmReady.mockReturnValue(
			new Promise((resolve) => {
				answer = resolve;
			}),
		);
		const { unmount } = renderRules();
		unmount();
		await act(async () => answer(true));
		expect(llm.generateWithBrowserLlm).not.toHaveBeenCalled();
	});
});
