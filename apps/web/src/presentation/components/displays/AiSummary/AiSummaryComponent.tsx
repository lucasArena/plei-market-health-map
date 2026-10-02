"use client";

import { useAiSummaryRules } from "@/presentation/components/displays/AiSummary/AiSummaryComponent.rules";
import type { AiSummaryProps } from "@/presentation/components/displays/AiSummary/AiSummaryComponent.types";
import { KeyInsights } from "@/presentation/components/displays/KeyInsights/KeyInsightsComponent";

const AI_SUMMARY_HEIGHT_CLASS = { collapsed: "h-44", expanded: "" };
const AI_SUMMARY_TOGGLE_ROW_CLASS = { collapsed: "-mt-6", expanded: "" };

export function AiSummary(props: Readonly<AiSummaryProps>) {
	const {
		contentRef,
		handleGenerate,
		isExpanded,
		isOverflowing,
		messages,
		progressLabel,
		progressPercent,
		status,
		text,
		toggleExpanded,
	} = useAiSummaryRules(props);

	return (
		<div
			className="space-y-2 rounded-xl bg-pleiful-moonlight-5 p-3.5"
			aria-busy={status === "loading" || status === "generating"}
		>
			<div
				ref={contentRef}
				data-testid="ai-summary-content"
				className={`relative overflow-hidden ${AI_SUMMARY_HEIGHT_CLASS[isExpanded ? "expanded" : "collapsed"]}`}
			>
				<KeyInsights
					title={messages.label}
					text={text ?? ""}
					introFirst={props.introFirst}
					isLoading={!text}
				/>
				{isOverflowing && !isExpanded && (
					<div
						aria-hidden="true"
						className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-pleiful-moonlight-5"
					/>
				)}
			</div>
			{isOverflowing && (
				<div
					data-testid="ai-summary-toggle-row"
					className={`relative z-10 flex justify-center ${AI_SUMMARY_TOGGLE_ROW_CLASS[isExpanded ? "expanded" : "collapsed"]}`}
				>
					<button
						type="button"
						onClick={toggleExpanded}
						aria-expanded={isExpanded}
						className="rounded-full border border-pleiful-moonlight-10 bg-white/90 px-3 py-1 text-xs font-medium text-pleiful-moonlight-70 shadow-sm transition-colors hover:bg-white"
					>
						{isExpanded ? messages.showLess : messages.showMore}
					</button>
				</div>
			)}
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
