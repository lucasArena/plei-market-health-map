import {
	SCORE_CARD_CLASS,
	SCORE_TONE_TEXT,
	SCORE_VALUE_CLASS,
} from "@/presentation/components/displays/ScoreCard/ScoreCardComponent.styles";
import type { ScoreCardProps } from "@/presentation/components/displays/ScoreCard/ScoreCardComponent.types";

export function ScoreCard({
	aside,
	caption,
	change,
	info,
	label,
	size = "secondary",
	testId,
	value,
}: Readonly<ScoreCardProps>) {
	const changeText = change && (
		<p className={`font-semibold ${SCORE_TONE_TEXT[change.tone]}`}>{change.label}</p>
	);
	return (
		<section aria-label={label} data-testid={testId} className={SCORE_CARD_CLASS}>
			<div className="flex items-center justify-between gap-2">
				<p className="flex items-center gap-1 text-xs text-[#6b7280]">
					{label}
					<span title={info} aria-label={info} role="img" className="inline-flex">
						<svg
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
							aria-hidden="true"
							className="size-3"
						>
							<circle cx="12" cy="12" r="10" />
							<path d="M12 16v-4M12 8h.01" />
						</svg>
					</span>
				</p>
				{aside && <p className="text-[11px] text-[#6b7280]">{aside}</p>}
			</div>
			{size === "primary" ? (
				<div className="flex items-end gap-2.5">
					<p className={`font-semibold text-[#111827] tabular-nums ${SCORE_VALUE_CLASS.primary}`}>
						{value}
					</p>
					<div className="flex flex-col pb-1.5 text-[13px]">
						{changeText}
						{caption && <p className="text-[11px] text-[#6b7280]">{caption}</p>}
					</div>
				</div>
			) : (
				<>
					<p className={`font-semibold text-[#111827] tabular-nums ${SCORE_VALUE_CLASS.secondary}`}>
						{value}
					</p>
					{change && (
						<p className={`text-[11px] ${SCORE_TONE_TEXT[change.tone]}`}>{change.label}</p>
					)}
				</>
			)}
		</section>
	);
}
