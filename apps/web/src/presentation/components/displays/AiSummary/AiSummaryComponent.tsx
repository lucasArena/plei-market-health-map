"use client";

import { useAiSummaryRules } from "@/presentation/components/displays/AiSummary/AiSummaryComponent.rules";
import type { AiSummaryProps } from "@/presentation/components/displays/AiSummary/AiSummaryComponent.types";
import { KeyInsights } from "@/presentation/components/displays/KeyInsights/KeyInsightsComponent";

export function AiSummary(props: Readonly<AiSummaryProps>) {
	const { handleGenerate, messages, progressLabel, progressPercent, status, text } =
		useAiSummaryRules(props);

	return (
		<div
			className="space-y-2 rounded-xl bg-pleiful-moonlight-5 p-3.5"
			aria-busy={status === "loading" || status === "generating"}
		>
			<KeyInsights title={messages.label} text={text} introFirst={props.introFirst} />
			{status === "idle" && (
				<div className="space-y-1">
					<button
						type="button"
						onClick={handleGenerate}
						className="rounded-full border px-3 py-1 text-xs font-medium transition-colors hover:bg-muted"
					>
						✨ {messages.generate}
					</button>
					<p className="text-[11px] text-muted-foreground">{messages.downloadHint}</p>
				</div>
			)}
			{status === "loading" && (
				<div role="status" className="space-y-1">
					<p className="text-[11px] text-muted-foreground">{progressLabel}</p>
					<div className="h-1 overflow-hidden rounded-full bg-muted">
						<div
							data-testid="ai-summary-progress"
							className="h-full rounded-full bg-foreground transition-[width] duration-300"
							style={{ width: `${progressPercent}%` }}
						/>
					</div>
				</div>
			)}
			{status === "generating" && (
				<p role="status" className="animate-pulse text-[11px] text-muted-foreground">
					{messages.writing}
				</p>
			)}
			{status === "ready" && <span data-testid="ai-summary-icon" className="sr-only" />}
			{status === "error" && <p className="text-[11px] text-muted-foreground">{messages.failed}</p>}
		</div>
	);
}
