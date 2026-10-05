import type { KeyInsightsProps } from "@/presentation/components/displays/KeyInsights/KeyInsightsComponent.types";

const REPEAT_PREFIX_WORDS = 8;
const SENTENCE_END = /[.!?:)"”»]$/;

function openingWords(line: string): string {
	return line.toLocaleLowerCase().split(/\s+/).slice(0, REPEAT_PREFIX_WORDS).join(" ");
}

export function cleanInsightLines(lines: string[]): string[] {
	const seen = new Set<string>();
	const unique = lines.filter((line) => {
		const opening = openingWords(line);
		if (seen.has(opening)) return false;
		seen.add(opening);
		return true;
	});
	const last = unique.at(-1);
	return unique.length > 1 && last && !SENTENCE_END.test(last) ? unique.slice(0, -1) : unique;
}

export function useKeyInsightsRules({ text, introFirst = false }: KeyInsightsProps) {
	const lines = text
		.split(/\n+/)
		.map((line) => line.trim().replace(/^(?:[-*•]|\d+[.)])\s+/, ""))
		.filter(Boolean);
	const uniqueLines = cleanInsightLines(lines);
	const intro = introFirst ? uniqueLines[0] : null;
	const items = introFirst ? uniqueLines.slice(1) : uniqueLines;
	return {
		intro,
		lines: items,
		isList: introFirst || items.length > 1 || /^\s*[-*•]\s/.test(text),
	};
}
