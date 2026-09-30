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
	it("includes the high-level facility activity signals", () => {
		const messages = prompt.build(
			facilitySubject({
				...FACILITY_DETAIL,
				stats: {
					...FACILITY_DETAIL.stats,
					popularTimes: [
						...FACILITY_DETAIL.stats.popularTimes,
						{ dayOfWeek: 1, timePeriod: 0, gamesPlayed: 1 },
					],
				},
			}),
			"en",
		);
		const [system, example, answer] = messages;

		expect(system?.content).toContain("last 28 days");
		expect(system?.content).toContain("in English");
		expect([example?.role, answer?.role]).toEqual(["user", "assistant"]);
		expect(messages.at(-1)?.content).toBe(
			[
				"Facts:",
				"Facility: Pegaso HTX.",
				"Pickup games played in the last 28 days (Aug 31 to Sep 27, 2026): 212.",
				"Confirmation rate: 84.8%.",
				"Unique players: 126.",
				"Activated players: 24.",
				"Change versus the previous 28 days: 6%.",
				"Busiest time: Saturday evenings.",
				"",
				"Write the summary in English.",
			].join("\n"),
		);
	});

	it("marks unavailable rates and falls back to the first time period", () => {
		const detail = {
			...FACILITY_DETAIL,
			stats: {
				...FACILITY_DETAIL.stats,
				confirmationRate: null,
				playedPeriodChangePercent: null,
				popularTimes: [],
			},
		};
		const content = prompt.build(facilitySubject(detail), "en").at(-1)?.content;
		expect(content).toContain("Confirmation rate: unavailable.");
		expect(content).toContain("Change versus the previous 28 days: unavailable.");
		expect(content).toContain("Busiest time: Monday mornings.");
	});

	it("answers in the viewer's language", () => {
		const portuguese = prompt.build(facilitySubject(FACILITY_DETAIL), "pt-BR");
		expect(portuguese.at(-1)?.content).toContain("Write the summary in Brazilian Portuguese.");
		expect(portuguese[2]?.content).toContain("taxa de confirmação");

		const french = prompt.build(facilitySubject(FACILITY_DETAIL), "fr");
		expect(french[0]?.content).toContain("in English");
		expect(french[2]?.content).toContain("confirmation rate");
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
