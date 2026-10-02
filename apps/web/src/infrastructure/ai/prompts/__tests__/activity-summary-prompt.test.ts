import type { FacilityDetailView } from "@market-health-map/core/application";
import { FACILITY_DETAIL } from "@/application/test/facility-detail";
import { ActivitySummaryPrompt } from "@/infrastructure/ai/prompts/activity-summary-prompt";

const prompt = new ActivitySummaryPrompt();

function facilitySubject(detail: FacilityDetailView) {
	return {
		kind: "facility" as const,
		id: detail.facility.id,
		name: detail.facility.name,
		stats: detail.stats,
	};
}

describe("ActivitySummaryPrompt", () => {
	it("grounds insights in comparisons and limits anomaly claims", () => {
		const messages = prompt.build(facilitySubject(FACILITY_DETAIL), "en");
		expect(messages[0]?.content).toContain("cannot establish historical normality");
		expect(messages[0]?.content).toContain("Small counts are weak evidence");
		expect(messages[2]?.content).toContain("Activation is weakening faster");
		const facts = messages.at(-1)?.content ?? "";
		expect(facts).toContain(
			"Period: the last 28 days (Sep 3 to Sep 30, 2026), compared with the previous 28 days.",
		);
		expect(facts).toContain("Pickup games played: 200 → 212, up 6% from the previous 28 days.");
		expect(facts).toContain("Unique players: 120 → 126, up 5% from the previous 28 days.");
		expect(facts).toContain("Newly activated players: 20 → 24, up 20% from the previous 28 days.");
		expect(facts).toMatch(
			/Confirmation rate: [\d.]+%, up 1\.5 percentage points from the previous 28 days\./,
		);
		expect(facts).not.toContain("Change versus the previous 28 days:");
		expect(messages.at(-1)?.content).toContain("Weekly games (oldest first)");
	});
	it("handles missing comparisons", () => {
		const content = prompt
			.build(
				facilitySubject({
					...FACILITY_DETAIL,
					stats: {
						...FACILITY_DETAIL.stats,
						confirmationRate: null,
						playedPeriodChangePercent: null,
						uniquePlayersPeriodChangePercent: null,
						activatedPlayersPeriodChangePercent: null,
						confirmationRateChangePoints: null,
					},
				}),
				"en",
			)
			.at(-1)?.content;
		expect(content).toContain("Confirmation rate: unavailable.");
		expect(content).toContain(
			"Pickup games played: 200 → 212, no previous baseline, so no percentage.",
		);
		expect(content).toContain("Unique players: 120 → 126, no previous baseline, so no percentage.");
	});

	it("puts every metric's own change on its line, with its direction in words", () => {
		const content = prompt
			.build(
				facilitySubject({
					...FACILITY_DETAIL,
					stats: {
						...FACILITY_DETAIL.stats,
						playedPeriodChangePercent: 14,
						uniquePlayersPeriodChangePercent: 11.5,
						activatedPlayersPeriodChangePercent: -34.5,
						confirmationRateChangePoints: 0,
					},
				}),
				"en",
			)
			.at(-1)?.content;
		expect(content).toContain("Pickup games played: 200 → 212, up 14% from the previous 28 days.");
		expect(content).toContain("Unique players: 120 → 126, up 11.5% from the previous 28 days.");
		expect(content).toContain(
			"Newly activated players: 20 → 24, down 34.5% from the previous 28 days.",
		);
		expect(content).toContain("Confirmation rate: 84.8%, unchanged from the previous 28 days.");
	});
	it("uses the viewer language with English fallback", () => {
		expect(prompt.build(facilitySubject(FACILITY_DETAIL), "pt-BR")[2]?.content).toContain(
			"ativação",
		);
		expect(prompt.build(facilitySubject(FACILITY_DETAIL), "fr")[0]?.content).toContain(
			"in English",
		);
	});
	it("describes a single market with its active facilities", () => {
		const content = prompt
			.build(
				{
					kind: "market",
					id: "2",
					name: "Houston",
					stats: FACILITY_DETAIL.stats,
					scope: {
						facilityCount: 48,
						activeFacilityCount: 31,
						marketCount: 1,
						activeMarketCount: 1,
					},
				},
				"en",
			)
			.at(-1)?.content;

		expect(content).toContain("Market: Houston.");
		expect(content).toContain("Active facilities: 31 of 48.");
		expect(content).not.toContain("Active markets");
	});

	it("describes all markets with active facilities and markets", () => {
		const content = prompt
			.build(
				{
					kind: "all-markets",
					id: "all",
					name: "All markets",
					stats: FACILITY_DETAIL.stats,
					scope: {
						facilityCount: 924,
						activeFacilityCount: 610,
						marketCount: 40,
						activeMarketCount: 34,
					},
				},
				"en",
			)
			.at(-1)?.content;

		expect(content).toContain("Scope: all Plei markets.");
		expect(content).toContain("Active facilities: 610 of 924.");
		expect(content).toContain("Active markets: 34 of 40.");
	});
});

it("grounds AI wording in the independently computed contributors", () => {
	const content = prompt.build(
		{
			kind: "all-markets",
			id: "all",
			name: "All markets",
			stats: FACILITY_DETAIL.stats,
			insightFacts: "Houston: games declined, 200 to 100.",
		},
		"en",
	);
	expect(content.at(-1)?.content).toContain(
		"Verified key insights (preserve named contributors and counts): Houston",
	);
	expect(content[0]?.content).toContain("All markets names markets only");
	expect(content[0]?.content).toContain("plain overall-change opening paragraph");
});
