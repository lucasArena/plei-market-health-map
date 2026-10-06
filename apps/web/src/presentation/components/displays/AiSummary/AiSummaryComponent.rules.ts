"use client";

import { formatMessage } from "@market-health-map/core/i18n";
import { useCallback, useEffect, useRef, useState } from "react";
import { activityTracker } from "@/infrastructure/activity/activity-tracker";
import { browserLlm } from "@/infrastructure/ai/browser-llm/browser-llm";
import {
	buildInsightChecks,
	supportedInsightText,
} from "@/infrastructure/ai/insight-check/insight-check";
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
			`${subject.kind}-${subject.id}-${subject.stats.period}`,
			subject.stats.end,
			locale,
		),
		prompt: activitySummaryPrompt.build(subject, locale),
		checks: buildInsightChecks(subject),
	};
}

const CHECKING: AiSummaryState = { status: "checking", text: null, progress: 0 };

export function summaryTextFor(state: AiSummaryState, fallback: string): string | null {
	if (state.text) return state.text;
	return state.status === "unsupported" || state.status === "error" ? fallback : null;
}

export function useAiSummaryRules({ context, fallback }: AiSummaryProps) {
	const { messages } = useMessages();
	const [state, setState] = useState<AiSummaryState>(CHECKING);
	const [isRequested, setIsRequested] = useState(false);
	const [expandedKey, setExpandedKey] = useState<string | null>(null);
	const [isOverflowing, setIsOverflowing] = useState(false);
	const contentRef = useRef<HTMLDivElement>(null);
	const { cacheKey, prompt, checks } = context;
	const text = summaryTextFor(state, fallback);
	const isExpanded = expandedKey === cacheKey;

	const handleGenerate = useCallback(() => setIsRequested(true), []);
	const toggleExpanded = useCallback(
		() => setExpandedKey((current) => (current === cacheKey ? null : cacheKey)),
		[cacheKey],
	);

	useEffect(() => {
		const supported = (text: string) => (checks ? supportedInsightText(text, checks) : text);
		const cached = supported(aiSummaryCache.read(cacheKey) ?? "");
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
				onText: (partial) =>
					update({ status: "generating", text: supported(partial) || null, progress: 1 }),
			});
			if (signal.aborted) return;
			if (!text) throw new Error("Empty AI summary");
			const checked = supported(text);
			if (!checked) throw new Error("No AI insight matched the data");
			aiSummaryCache.write(cacheKey, checked);
			activityTracker.count("aiSummaries");
			update({ status: "ready", text: checked, progress: 1 });
		};
		run().catch(() => update({ status: "error", text: null, progress: 0 }));
		return () => controller.abort();
	}, [cacheKey, checks, prompt, isRequested]);

	useEffect(() => {
		const content = contentRef.current;
		if (!content || isExpanded) return;
		setIsOverflowing(Boolean(text) && content.scrollHeight > content.clientHeight);
	}, [isExpanded, text]);

	const progressPercent = Math.round(state.progress * 100);

	return {
		contentRef,
		isExpanded,
		isOverflowing: isOverflowing || isExpanded,
		toggleExpanded,
		handleGenerate,
		messages: messages.facilityAi,
		progressLabel: formatMessage(messages.facilityAi.loading, { percent: String(progressPercent) }),
		progressPercent,
		status: state.status,
		text,
	};
}
