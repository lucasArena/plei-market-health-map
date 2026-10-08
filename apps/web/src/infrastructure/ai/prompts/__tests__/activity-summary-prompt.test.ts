import type { ActivityPeriodView } from "@market-health-map/core/application";
import {
	FACILITY_DETAIL,
	FACILITY_MONTH_ACTIVITY,
	FACILITY_WEEK_ACTIVITY,
} from "@/application/test/facility-detail";
import { ActivitySummaryPrompt } from "@/infrastructure/ai/prompts/activity-summary-prompt";

const prompt = new ActivitySummaryPrompt();

function facilitySubject(stats: ActivityPeriodView = FACILITY_MONTH_ACTIVITY) {
	return {
		kind: "facility" as const,
		id: FACILITY_DETAIL.facility.id,
		name: FACILITY_DETAIL.facility.name,
		stats,
	};
}

describe("ActivitySummaryPrompt", () => {
	it("grounds insights in comparisons and limits anomaly claims", () => {
		const messages = prompt.build(facilitySubject(), "en");
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
		expect(messages.at(-1)?.content).not.toContain("Weekly games");
	});
	it("handles missing comparisons", () => {
		const content = prompt
			.build(
				facilitySubject({
					...FACILITY_MONTH_ACTIVITY,
					confirmationRate: null,
					playedChangePercent: null,
					uniquePlayersChangePercent: null,
					activatedPlayersChangePercent: null,
					confirmationRateChangePoints: null,
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
					...FACILITY_MONTH_ACTIVITY,
					playedChangePercent: 14,
					uniquePlayersChangePercent: 11.5,
					activatedPlayersChangePercent: -34.5,
					confirmationRateChangePoints: 0,
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
	it("compares the last 7 days with the 7 days before when the week is selected", () => {
		const messages = prompt.build(facilitySubject(FACILITY_WEEK_ACTIVITY), "pt-BR");
		const facts = messages.at(-1)?.content ?? "";

		expect(messages[0]?.content).toContain("Identify the most useful signals in the last 7 days");
		expect(messages[1]?.content).toContain("Period: the last 7 days (Aug 24 to Aug 30, 2026)");
		expect(messages[2]?.content).toContain("em relação aos 7 dias anteriores");
		expect(facts).toContain("compared with the previous 7 days.");
		expect(facts).toContain("Pickup games played: 51 → 55, up 7.8% from the previous 7 days.");
		expect(prompt.build(facilitySubject(FACILITY_WEEK_ACTIVITY), "fr")[2]?.content).toContain(
			"versus the previous 7 days",
		);
	});
	it("uses the viewer language with English fallback", () => {
		expect(prompt.build(facilitySubject(), "pt-BR")[2]?.content).toContain("ativação");
		expect(prompt.build(facilitySubject(), "fr")[0]?.content).toContain("in English");
	});
	it("describes a single market with its active facilities", () => {
		const content = prompt
			.build(
				{
					kind: "market",
					id: "2",
					name: "Houston",
					stats: FACILITY_MONTH_ACTIVITY,
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
					stats: FACILITY_MONTH_ACTIVITY,
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
			stats: FACILITY_MONTH_ACTIVITY,
			insightFacts: "Houston: games declined, 200 to 100.",
		},
		"en",
	);
	expect(content.at(-1)?.content).toContain(
		"Largest contributors to the games change (preserve their names and counts): Houston",
	);
	expect(content[0]?.content).toContain("All markets names markets only");
	expect(content[0]?.content).toContain("plain overall-change opening paragraph");
});

it("says which game departments the facts cover when the Layers filter is on", () => {
	const subject = {
		kind: "all-markets" as const,
		id: "all~magic+organizers",
		name: "All markets",
		stats: FACILITY_MONTH_ACTIVITY,
	};

	const filtered = prompt
		.build({ ...subject, gameDepartments: ["magic", "organizers"] }, "en")
		.at(-1)?.content;
	const unfiltered = prompt.build(subject, "en").at(-1)?.content;

	expect(filtered).toContain("Game departments: Magic, Organizers only.");
	expect(filtered).toContain("contributors and players count only these departments");
	expect(filtered).toContain("newly activated players had their first game in one of them");
	expect(filtered).not.toContain("every department");
	expect(unfiltered).not.toContain("Game departments");
});
