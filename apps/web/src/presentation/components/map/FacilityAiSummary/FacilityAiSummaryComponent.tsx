"use client";

import { useFacilityAiSummaryRules } from "@/presentation/components/map/FacilityAiSummary/FacilityAiSummaryComponent.rules";
import type { FacilityAiSummaryProps } from "@/presentation/components/map/FacilityAiSummary/FacilityAiSummaryComponent.types";

export function FacilityAiSummary(props: Readonly<FacilityAiSummaryProps>) {
	const { handleGenerate, messages, progressLabel, progressPercent, status, text } =
		useFacilityAiSummaryRules(props);

	return (
		<div
			className="space-y-2 rounded-xl bg-pleiful-moonlight-5 p-3.5"
			aria-busy={status === "loading" || status === "generating"}
		>
			<p className="flex items-center gap-1.5 text-xs font-semibold text-pleiful-moonlight-70">
				<svg aria-hidden="true" viewBox="0 0 24 24" className="size-3.5 fill-current">
					<path d="M12 2l1.9 5.6L19.5 9.5l-5.6 1.9L12 17l-1.9-5.6L4.5 9.5l5.6-1.9zM19 14l.9 2.6 2.6.9-2.6.9L19 21l-.9-2.6-2.6-.9 2.6-.9zM5 15l.7 1.8 1.8.7-1.8.7L5 20l-.7-1.8-1.8-.7 1.8-.7z" />
				</svg>
				{messages.label}
			</p>
			<p className="text-xs leading-relaxed">{text}</p>
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
