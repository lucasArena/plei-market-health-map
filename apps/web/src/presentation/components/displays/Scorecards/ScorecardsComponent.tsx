import { ScoreCard } from "@/presentation/components/displays/ScoreCard/ScoreCardComponent";
import type { ScorecardsProps } from "@/presentation/components/displays/Scorecards/ScorecardsComponent.types";

export function Scorecards({
	cancellation,
	confirmation,
	played,
	title,
}: Readonly<ScorecardsProps>) {
	return (
		<section aria-label={title} className="space-y-2.5">
			<h3 className="text-sm font-semibold text-[#111827] dark:text-foreground">{title}</h3>
			<ScoreCard {...played} size="primary" testId="score-played" />
			<div className="flex gap-2.5">
				<ScoreCard {...confirmation} testId="score-confirmation" />
				<ScoreCard {...cancellation} testId="score-cancellation" />
			</div>
		</section>
	);
}
