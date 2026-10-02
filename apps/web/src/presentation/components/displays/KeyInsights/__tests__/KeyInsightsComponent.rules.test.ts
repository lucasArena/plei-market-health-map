import { renderHook } from "@testing-library/react";
import {
	cleanInsightLines,
	useKeyInsightsRules,
} from "@/presentation/components/displays/KeyInsights/KeyInsightsComponent.rules";

describe("cleanInsightLines", () => {
	it("drops a bullet that repeats an earlier one, even when it's worded a little differently", () => {
		expect(
			cleanInsightLines([
				"The Bay Area's unique players have increased by 50% over the last 28 days, suggesting growth.",
				"Confirmation fell 6.2 points.",
				"The Bay Area's unique players have increased by 50% over the last 28 days, suggesting a significant growth.",
			]),
		).toEqual([
			"The Bay Area's unique players have increased by 50% over the last 28 days, suggesting growth.",
			"Confirmation fell 6.2 points.",
		]);
	});

	it("drops a last line the model cut off mid-sentence, but keeps a single line", () => {
		expect(
			cleanInsightLines([
				"Games rose 37.5%.",
				"The largest contributors are East Bay Sports and the Davis Soccer Club,",
			]),
		).toEqual(["Games rose 37.5%."]);
		expect(cleanInsightLines(["Games rose 37.5% (24 → 33)"])).toEqual([
			"Games rose 37.5% (24 → 33)",
		]);
		expect(cleanInsightLines(["Games rose.", "Players rose 50%!"])).toEqual([
			"Games rose.",
			"Players rose 50%!",
		]);
	});
});

describe("useKeyInsightsRules", () => {
	it("cleans the lines before splitting the intro from the bullets", () => {
		const { result } = renderHook(() =>
			useKeyInsightsRules({
				title: "Key insights",
				text: "Overall games rose.\n- Houston rose 10%.\n- Houston rose 10%.\n- Miami fell",
				introFirst: true,
			}),
		);

		expect(result.current.intro).toBe("Overall games rose.");
		expect(result.current.lines).toEqual(["Houston rose 10%."]);
	});
});
