"use client";

import { formatMessage } from "@market-health-map/core/i18n";
import { useCallback, useEffect, useState } from "react";
import { browserLlm } from "@/infrastructure/ai/browser-llm/browser-llm";
import { activitySummaryPrompt } from "@/infrastructure/ai/prompts/activity-summary-prompt";
import type { ActivitySummarySubject } from "@/infrastructure/ai/prompts/activity-summary-prompt.types";
import { aiSummaryCache } from "@/infrastructure/cache/local-storage/ai-summary/ai-summary-cache";
import type {
	AiSummaryContext,
	AiSummaryProps,
	AiSummaryState,
} from "@/presentation/components/displays/AiSummary/AiSummaryComponent.types";
import { useMessages } from "@/presentation/components/providers/MessagesProvider/MessagesProviderComponent";

export function aiSummaryContextFor(
	subject: ActivitySummarySubject,
	locale: string,
): AiSummaryContext {
	return {
		cacheKey: aiSummaryCache.keyFor(
			`${subject.kind}-${subject.id}`,
			subject.stats.weekStart,
			locale,
		),
		prompt: activitySummaryPrompt.build(subject, locale),
	};
}

const CHECKING: AiSummaryState = { status: "checking", text: null, progress: 0 };

export function useAiSummaryRules({ context, fallback }: AiSummaryProps) {
	const { messages } = useMessages();
	const [state, setState] = useState<AiSummaryState>(CHECKING);
	const [isRequested, setIsRequested] = useState(false);
	const { cacheKey, prompt } = context;

	const handleGenerate = useCallback(() => setIsRequested(true), []);

	useEffect(() => {
		const cached = aiSummaryCache.read(cacheKey);
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
		const update = (next: AiSummaryState) => {
			if (!signal.aborted) setState(next);
		};
		const run = async () => {
			update(CHECKING);
			const canRun = isRequested || (await browserLlm.isReady());
			if (signal.aborted) return;
			if (!canRun) return update({ status: "idle", text: null, progress: 0 });
			update({ status: "loading", text: null, progress: 0 });
			const text = await browserLlm.generate(prompt, {
				signal,
				onProgress: (progress) => update({ status: "loading", text: null, progress }),
				onText: (partial) => update({ status: "generating", text: partial, progress: 1 }),
			});
			if (signal.aborted) return;
			if (!text) throw new Error("Empty AI summary");
			aiSummaryCache.write(cacheKey, text);
			update({ status: "ready", text, progress: 1 });
		};
		run().catch(() => update({ status: "error", text: null, progress: 0 }));
		return () => controller.abort();
	}, [cacheKey, prompt, isRequested]);

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
