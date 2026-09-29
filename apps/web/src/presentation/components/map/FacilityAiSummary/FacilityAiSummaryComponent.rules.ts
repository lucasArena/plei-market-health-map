"use client";

import { formatMessage } from "@market-health-map/core/i18n";
import { useCallback, useEffect, useState } from "react";
import { browserLlm } from "@/infrastructure/ai/browser-llm/browser-llm";
import { facilitySummaryPrompt } from "@/infrastructure/ai/prompts/facility-summary-prompt";
import { facilitySummaryCache } from "@/infrastructure/cache/local-storage/facility-summary/facility-summary-cache";
import type {
	FacilityAiSummaryProps,
	FacilityAiSummaryState,
} from "@/presentation/components/map/FacilityAiSummary/FacilityAiSummaryComponent.types";
import { useMessages } from "@/presentation/components/providers/MessagesProvider/MessagesProviderComponent";

const CHECKING: FacilityAiSummaryState = { status: "checking", text: null, progress: 0 };

export function useFacilityAiSummaryRules({ detail, fallback }: FacilityAiSummaryProps) {
	const { locale, messages } = useMessages();
	const [state, setState] = useState<FacilityAiSummaryState>(CHECKING);
	const [isRequested, setIsRequested] = useState(false);
	const cacheKey = facilitySummaryCache.keyFor(detail, locale);

	const handleGenerate = useCallback(() => setIsRequested(true), []);

	useEffect(() => {
		const cached = facilitySummaryCache.read(cacheKey);
		if (cached) {
			setState({ status: "ready", text: cached, progress: 1 });
			return;
		}
		if (!browserLlm.isSupported()) {
			setState({ status: "unsupported", text: null, progress: 0 });
			return;
		}
		const controller = new AbortController();
		const { signal } = controller;
		const update = (next: FacilityAiSummaryState) => {
			if (!signal.aborted) setState(next);
		};
		const run = async () => {
			update(CHECKING);
			const canRun = isRequested || (await browserLlm.isReady());
			if (signal.aborted) return;
			if (!canRun) return update({ status: "idle", text: null, progress: 0 });
			update({ status: "loading", text: null, progress: 0 });
			const text = await browserLlm.generate(facilitySummaryPrompt.build(detail, locale), {
				signal,
				onProgress: (progress) => update({ status: "loading", text: null, progress }),
				onText: (partial) => update({ status: "generating", text: partial, progress: 1 }),
			});
			if (signal.aborted) return;
			if (!text) throw new Error("Empty AI summary");
			facilitySummaryCache.write(cacheKey, text);
			update({ status: "ready", text, progress: 1 });
		};
		run().catch(() => update({ status: "error", text: null, progress: 0 }));
		return () => controller.abort();
	}, [cacheKey, detail, isRequested, locale]);

	const progressPercent = Math.round(state.progress * 100);

	return {
		handleGenerate,
		messages: messages.facilityAi,
		progressLabel: formatMessage(messages.facilityAi.loading, { percent: String(progressPercent) }),
		progressPercent,
		status: state.status,
		text: state.text || fallback,
	};
}
