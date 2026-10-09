import { useKeyInsightsRules } from "@/presentation/components/displays/KeyInsights/KeyInsightsComponent.rules";
import { INSIGHT_TONE_STYLE } from "@/presentation/components/displays/KeyInsights/KeyInsightsComponent.styles";
import type { KeyInsightsProps } from "@/presentation/components/displays/KeyInsights/KeyInsightsComponent.types";

export function KeyInsights(props: Readonly<KeyInsightsProps>) {
	const { intro, lines, isList } = useKeyInsightsRules(props);
	const { accent, skeleton } = INSIGHT_TONE_STYLE[props.tone ?? "neutral"];
	return (
		<>
			<h3 className={`mb-2 flex items-center gap-1.5 text-xs font-semibold ${accent}`}>
				<svg
					aria-hidden="true"
					data-testid="key-insights-ai-icon"
					viewBox="0 0 24 24"
					className="size-3.5 fill-current"
				>
					<path d="M12 2l1.9 5.6L19.5 9.5l-5.6 1.9L12 17l-1.9-5.6L4.5 9.5l5.6-1.9zM19 14l.9 2.6 2.6.9-2.6.9L19 21l-.9-2.6-2.6-.9 2.6-.9zM5 15l.7 1.8 1.8.7-1.8.7L5 20l-.7-1.8-1.8-.7 1.8-.7z" />
				</svg>
				{props.title}
			</h3>
			{props.isLoading && (
				<div
					data-testid="key-insights-skeleton"
					aria-hidden="true"
					className="animate-pulse space-y-2.5 pt-1"
				>
					<div className={`h-3 w-11/12 rounded ${skeleton}`} />
					<div className={`h-3 w-full rounded ${skeleton}`} />
					<div className={`h-3 w-4/5 rounded ${skeleton}`} />
					<div className={`h-3 w-2/3 rounded ${skeleton}`} />
				</div>
			)}
			{!props.isLoading && intro && <p className="mb-3 text-sm leading-relaxed">{intro}</p>}
			{!props.isLoading &&
				(isList && lines.length > 0 ? (
					<ul className="list-disc space-y-2 pl-4 text-sm leading-relaxed">
						{lines.map((line) => (
							<li key={line}>{line}</li>
						))}
					</ul>
				) : (
					<p className="text-sm leading-relaxed">{lines[0]}</p>
				))}
		</>
	);
}
