"use client";

import {
	AI_SUMMARY_BOX_CLASS,
	AI_SUMMARY_HEIGHT_CLASS,
} from "@/presentation/components/displays/AiSummary/AiSummaryComponent.styles";
import { useAiSummarySkeletonRules } from "@/presentation/components/displays/AiSummarySkeleton/AiSummarySkeletonComponent.rules";
import type { AiSummarySkeletonProps } from "@/presentation/components/displays/AiSummarySkeleton/AiSummarySkeletonComponent.types";
import { KeyInsights } from "@/presentation/components/displays/KeyInsights/KeyInsightsComponent";
import { INSIGHT_TONE_STYLE } from "@/presentation/components/displays/KeyInsights/KeyInsightsComponent.styles";

export function AiSummarySkeleton({ testId }: Readonly<AiSummarySkeletonProps>) {
	const { label } = useAiSummarySkeletonRules();
	return (
		<div
			data-testid={testId}
			aria-busy="true"
			className={`${AI_SUMMARY_BOX_CLASS} ${INSIGHT_TONE_STYLE.neutral.box}`}
		>
			<div className={`overflow-hidden ${AI_SUMMARY_HEIGHT_CLASS.collapsed}`}>
				<KeyInsights title={label} text="" isLoading />
			</div>
		</div>
	);
}
