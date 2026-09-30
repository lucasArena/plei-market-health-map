import type { KeyInsightsProps } from "@/presentation/components/displays/KeyInsights/KeyInsightsComponent.types";

export function useKeyInsightsRules({ text, introFirst = false }: KeyInsightsProps) {
	const lines = text
		.split(/\n+/)
		.map((line) => line.trim().replace(/^(?:[-*•]|\d+[.)])\s+/, ""))
		.filter(Boolean);
	const uniqueLines = [...new Set(lines)];
	const intro = introFirst ? uniqueLines[0] : null;
	const items = introFirst ? uniqueLines.slice(1) : uniqueLines;
	return {
		intro,
		lines: items,
		isList: introFirst || items.length > 1 || /^\s*[-*•]\s/.test(text),
	};
}
